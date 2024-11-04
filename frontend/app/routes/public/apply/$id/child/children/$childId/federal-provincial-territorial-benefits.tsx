import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../../../page-ids.json';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { loadApplyChildState, loadApplySingleChildState } from '~/route-helpers/apply-child-route-helpers.server';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/route-helpers/apply-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum HasFederalBenefitsOption {
  No = 'no',
  Yes = 'yes',
}

enum HasProvincialTerritorialBenefitsOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.federalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply-child:children.dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplySingleChildState({ params, request, session });

  const { CANADA_COUNTRY_ID } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = appContainer.get(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const allRegions = appContainer.get(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).listAndSortLocalizedProvinceTerritoryStates(locale);
  const provincialTerritorialSocialPrograms = appContainer.get(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);
  const regions = allRegions.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);

  const csrfToken = String(session.get('csrfToken'));

  const childNumber = t('apply-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('apply-child:children.dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('apply-child:children.dental-benefits.title', { childName: childNumber }) }),
  };

  return json({
    csrfToken,
    defaultState: state.dentalBenefits,
    editMode: state.editMode,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    regions,
    childName,
    i18nOptions: { childName },
  });
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/children/federal-provincial-territorial-benefits');

  const state = loadApplySingleChildState({ params, request, session });
  const applyState = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ errorMap: () => ({ message: t('apply-child:children.dental-benefits.error-message.federal-benefit-required') }) }),
      federalSocialProgram: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits) {
        if (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
        }
      }
    })
    .transform((val) => {
      return {
        ...val,
        federalSocialProgram: val.hasFederalBenefits ? val.federalSocialProgram : undefined,
      };
    }) satisfies z.ZodType<DentalFederalBenefitsState>;

  const provincialTerritorialBenefitsSchema = z
    .object({
      hasProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('apply-child:children.dental-benefits.error-message.provincial-benefit-required') }) }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
        }
      }
    })
    .transform((val) => {
      return {
        ...val,
        province: val.hasProvincialTerritorialBenefits ? val.province : undefined,
        provincialTerritorialSocialProgram: val.hasProvincialTerritorialBenefits ? val.provincialTerritorialSocialProgram : undefined,
      };
    }) satisfies z.ZodType<DentalProvincialTerritorialBenefitsState>;

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const dentalBenefits = {
    hasFederalBenefits: formData.get('hasFederalBenefits') ? formData.get('hasFederalBenefits') === HasFederalBenefitsOption.Yes : undefined,
    federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
    hasProvincialTerritorialBenefits: formData.get('hasProvincialTerritorialBenefits') ? formData.get('hasProvincialTerritorialBenefits') === HasProvincialTerritorialBenefitsOption.Yes : undefined,
    provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
    province: formData.get('province') ? String(formData.get('province')) : undefined,
  };

  const parsedFederalBenefitsResult = federalBenefitsSchema.safeParse(dentalBenefits);
  const parsedProvincialTerritorialBenefitsResult = provincialTerritorialBenefitsSchema.safeParse(dentalBenefits);

  if (!parsedFederalBenefitsResult.success || !parsedProvincialTerritorialBenefitsResult.success) {
    return json({
      errors: {
        ...(!parsedFederalBenefitsResult.success ? transformFlattenedError(parsedFederalBenefitsResult.error.flatten()) : {}),
        ...(!parsedProvincialTerritorialBenefitsResult.success ? transformFlattenedError(parsedProvincialTerritorialBenefitsResult.error.flatten()) : {}),
      },
    });
  }

  saveApplyState({
    params,
    session,
    state: {
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        return {
          ...child,
          dentalBenefits: {
            ...parsedFederalBenefitsResult.data,
            ...parsedProvincialTerritorialBenefitsResult.data,
          },
        };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/child/review-child-information', params));
  }

  return redirect(getPathById('public/apply/$id/child/children/index', params));
}

export default function AccessToDentalInsuranceQuestion() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, federalSocialPrograms, provincialTerritorialSocialPrograms, regions, defaultState, editMode, childName } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(defaultState?.hasFederalBenefits);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(defaultState?.hasProvincialTerritorialBenefits);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState?.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState?.province);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasFederalBenefits: 'input-radio-has-federal-benefits-option-0',
    federalSocialProgram: 'input-radio-federal-social-programs-option-0',
    hasProvincialTerritorialBenefits: 'input-radio-has-provincial-territorial-benefits-option-0',
    province: 'province',
    provincialTerritorialSocialProgram: 'input-radio-provincial-territorial-social-programs-option-0',
  });

  function handleOnHasFederalBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasFederalBenefitValue(e.target.value === HasFederalBenefitsOption.Yes);
  }

  function handleOnHasProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasProvincialTerritorialBenefitValue(e.target.value === HasProvincialTerritorialBenefitsOption.Yes);
    if (e.target.value !== HasProvincialTerritorialBenefitsOption.Yes) {
      setProvinceValue(undefined);
      setProvincialTerritorialSocialProgramValue(undefined);
    }
  }

  function handleOnProvincialTerritorialSocialProgramChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setProvincialTerritorialSocialProgramValue(e.target.value);
  }

  function handleOnRegionChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    setProvinceValue(e.target.value);
    setProvincialTerritorialSocialProgramValue(undefined);
  }

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-child:children.dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('apply-child:children.dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-child:children.dental-benefits.federal-benefits.title', { childName })}</legend>
            <InputRadios
              id="has-federal-benefits"
              name="hasFederalBenefits"
              legend={t('apply-child:children.dental-benefits.federal-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.dental-benefits.federal-benefits.option-no" />,
                  value: HasFederalBenefitsOption.No,
                  defaultChecked: hasFederalBenefitValue === false,
                  onChange: handleOnHasFederalBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.dental-benefits.federal-benefits.option-yes" />,
                  value: HasFederalBenefitsOption.Yes,
                  defaultChecked: hasFederalBenefitValue === true,
                  onChange: handleOnHasFederalBenefitChanged,
                  append: hasFederalBenefitValue === true && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={t('apply-child:children.dental-benefits.federal-benefits.social-programs.legend')}
                      legendClassName="font-normal"
                      options={federalSocialPrograms.map((option) => ({
                        children: option.name,
                        defaultChecked: defaultState?.federalSocialProgram === option.id,
                        value: option.id,
                      }))}
                      errorMessage={errors?.federalSocialProgram}
                      required
                    />
                  ),
                },
              ]}
              errorMessage={errors?.hasFederalBenefits}
              required
            />
          </fieldset>
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-child:children.dental-benefits.provincial-territorial-benefits.title')}</legend>
            <InputRadios
              id="has-provincial-territorial-benefits"
              name="hasProvincialTerritorialBenefits"
              legend={t('apply-child:children.dental-benefits.provincial-territorial-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.dental-benefits.provincial-territorial-benefits.option-no" />,
                  value: HasProvincialTerritorialBenefitsOption.No,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === false,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:children.dental-benefits.provincial-territorial-benefits.option-yes" />,
                  value: HasProvincialTerritorialBenefitsOption.Yes,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === true,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  append: hasProvincialTerritorialBenefitValue === true && (
                    <div className="space-y-6">
                      <InputSelect
                        id="province"
                        name="province"
                        className="w-full sm:w-1/2"
                        label={t('apply-child:children.dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                        onChange={handleOnRegionChanged}
                        options={[
                          {
                            children: t('apply-child:children.dental-benefits.select-one'),
                            value: '',
                            hidden: true,
                          },
                          ...regions.map((region) => ({ id: region.id, value: region.id, children: region.name })),
                        ]}
                        defaultValue={provinceValue}
                        errorMessage={errors?.province}
                        required
                      />
                      {provinceValue && (
                        <InputRadios
                          id="provincial-territorial-social-programs"
                          name="provincialTerritorialSocialProgram"
                          legend={t('apply-child:children.dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
                          legendClassName="font-normal"
                          errorMessage={errors?.provincialTerritorialSocialProgram}
                          options={provincialTerritorialSocialPrograms
                            .filter((program) => program.provinceTerritoryStateId === provinceValue)
                            .map((option) => ({
                              children: option.name,
                              value: option.id,
                              checked: provincialTerritorialSocialProgramValue === option.id,
                              onChange: handleOnProvincialTerritorialSocialProgramChanged,
                            }))}
                          required
                        />
                      )}
                    </div>
                  ),
                },
              ]}
              errorMessage={errors?.hasProvincialTerritorialBenefits}
              required
            />
          </fieldset>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child access to other federal, provincial or territorial dental benefits click">
                {t('apply-child:children.dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Child access to other federal, provincial or territorial dental benefits click"
              >
                {t('apply-child:children.dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Child access to other federal, provincial or territorial dental benefits click"
              >
                {t('apply-child:children.dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/children/$childId/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child access to other federal, provincial or territorial dental benefits click"
              >
                {t('apply-child:children.dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

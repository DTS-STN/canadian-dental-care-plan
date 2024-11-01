import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewAdultChildState } from '~/route-helpers/renew-adult-child-route-helpers.server';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/route-helpers/renew-route-helpers.server';
import { saveRenewState } from '~/route-helpers/renew-route-helpers.server';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.updateFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'renew-adult-child:update-dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const { CANADA_COUNTRY_ID } = configProvider.getServerConfig();

  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = serviceProvider.getFederalGovernmentInsurancePlanService().listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const provinceTerritoryStates = serviceProvider.getProvinceTerritoryStateService().listAndSortLocalizedProvinceTerritoryStatesByCountryId(CANADA_COUNTRY_ID, locale);
  const provincialTerritorialSocialPrograms = serviceProvider.getProvincialGovernmentInsurancePlanService().listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:update-dental-benefits.title') }) };

  return json({
    csrfToken,
    defaultState: state.dentalBenefits,
    federalBenefitsChanged: state.confirmDentalBenefits?.federalBenefitsChanged,
    provincialTerritorialBenefitsChanged: state.confirmDentalBenefits?.provincialTerritorialBenefitsChanged,
    editMode: state.editMode,
    federalSocialPrograms,
    id: state.id,
    meta,
    provincialTerritorialSocialPrograms,
    provinceTerritoryStates,
  });
}

export async function action({ context: { configProvider, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/adult-child/update-federal-provincial-territorial');
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:update-dental-benefits.error-message.federal-benefit-required') }) }),
      federalSocialProgram: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits) {
        if (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:update-dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
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
      hasProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:update-dental-benefits.error-message.provincial-benefit-required') }) }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:update-dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:update-dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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

  const dentalFederalBenefits =
    state.confirmDentalBenefits?.federalBenefitsChanged && formData.get('hasFederalBenefits')
      ? {
          hasFederalBenefits: formData.get('hasFederalBenefits') === HasFederalBenefitsOption.Yes,
          federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
        }
      : undefined;

  const dentalProvincialTerritorialBenefits =
    state.confirmDentalBenefits?.provincialTerritorialBenefitsChanged && formData.get('hasProvincialTerritorialBenefits')
      ? {
          hasProvincialTerritorialBenefits: formData.get('hasProvincialTerritorialBenefits') === HasProvincialTerritorialBenefitsOption.Yes,
          provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
          province: formData.get('province') ? String(formData.get('province')) : undefined,
        }
      : undefined;

  const parsedFederalBenefitsResult = dentalFederalBenefits ? federalBenefitsSchema.safeParse(dentalFederalBenefits) : undefined;
  const parsedProvincialTerritorialBenefitsResult = dentalProvincialTerritorialBenefits ? provincialTerritorialBenefitsSchema.safeParse(dentalProvincialTerritorialBenefits) : undefined;

  if ((parsedFederalBenefitsResult && !parsedFederalBenefitsResult.success) || (parsedProvincialTerritorialBenefitsResult && !parsedProvincialTerritorialBenefitsResult.success)) {
    return json({
      errors: {
        ...(parsedFederalBenefitsResult && !parsedFederalBenefitsResult.success ? transformFlattenedError(parsedFederalBenefitsResult.error.flatten()) : {}),
        ...(parsedProvincialTerritorialBenefitsResult && !parsedProvincialTerritorialBenefitsResult.success ? transformFlattenedError(parsedProvincialTerritorialBenefitsResult.error.flatten()) : {}),
      },
    });
  }

  saveRenewState({
    params,
    session,
    state: {
      dentalBenefits: {
        ...(parsedFederalBenefitsResult ? parsedFederalBenefitsResult.data : { hasFederalBenefits: false }), //TODO Replace placeholder data with renewal user data
        ...(parsedProvincialTerritorialBenefitsResult ? parsedProvincialTerritorialBenefitsResult.data : { hasProvincialTerritorialBenefits: false }), //TODO Replace placeholder data with renewal user data
      },
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/children/index', params));
}

export default function RenewAdultChildUpdateFederalProvincialTerritorialBenefits() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, federalSocialPrograms, provincialTerritorialSocialPrograms, provinceTerritoryStates, defaultState, editMode, federalBenefitsChanged, provincialTerritorialBenefitsChanged } = useLoaderData<typeof loader>();
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
      <div className="my-6 sm:my-8">
        <Progress value={88} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult-child:update-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('renew-adult-child:update-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          {federalBenefitsChanged && (
            <fieldset className="mb-6">
              <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-adult-child:update-dental-benefits.federal-benefits.title')}</legend>
              <InputRadios
                id="has-federal-benefits"
                name="hasFederalBenefits"
                legend={t('renew-adult-child:update-dental-benefits.federal-benefits.legend')}
                options={[
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:update-dental-benefits.federal-benefits.option-yes" />,
                    value: HasFederalBenefitsOption.Yes,
                    defaultChecked: hasFederalBenefitValue === true,
                    onChange: handleOnHasFederalBenefitChanged,
                    append: hasFederalBenefitValue === true && (
                      <InputRadios
                        id="federal-social-programs"
                        name="federalSocialProgram"
                        legend={t('renew-adult-child:update-dental-benefits.federal-benefits.social-programs.legend')}
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
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:update-dental-benefits.federal-benefits.option-no" />,
                    value: HasFederalBenefitsOption.No,
                    defaultChecked: hasFederalBenefitValue === false,
                    onChange: handleOnHasFederalBenefitChanged,
                  },
                ]}
                errorMessage={errors?.hasFederalBenefits}
                required
              />
            </fieldset>
          )}
          {provincialTerritorialBenefitsChanged && (
            <fieldset className="mb-8">
              <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-adult-child:update-dental-benefits.provincial-territorial-benefits.title')}</legend>
              <InputRadios
                id="has-provincial-territorial-benefits"
                name="hasProvincialTerritorialBenefits"
                legend={t('renew-adult-child:update-dental-benefits.provincial-territorial-benefits.legend')}
                options={[
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:update-dental-benefits.provincial-territorial-benefits.option-yes" />,
                    value: HasProvincialTerritorialBenefitsOption.Yes,
                    defaultChecked: hasProvincialTerritorialBenefitValue === true,
                    onChange: handleOnHasProvincialTerritorialBenefitChanged,
                    append: hasProvincialTerritorialBenefitValue && (
                      <div className="space-y-6">
                        <InputSelect
                          id="province"
                          name="province"
                          className="w-full sm:w-1/2"
                          label={t('renew-adult-child:update-dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                          onChange={handleOnRegionChanged}
                          options={[
                            {
                              children: t('renew-adult-child:update-dental-benefits.select-one'),
                              value: '',
                              hidden: true,
                            },
                            ...provinceTerritoryStates.map((region) => ({ id: region.id, value: region.id, children: region.name })),
                          ]}
                          defaultValue={provinceValue}
                          errorMessage={errors?.province}
                          required
                        />
                        {provinceValue && (
                          <InputRadios
                            id="provincial-territorial-social-programs"
                            name="provincialTerritorialSocialProgram"
                            legend={t('renew-adult-child:update-dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:update-dental-benefits.provincial-territorial-benefits.option-no" />,
                    value: HasProvincialTerritorialBenefitsOption.No,
                    defaultChecked: defaultState?.hasProvincialTerritorialBenefits === false,
                    onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  },
                ]}
                errorMessage={errors?.hasProvincialTerritorialBenefits}
                required
              />
            </fieldset>
          )}
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other dental benefits click">
                {t('renew-adult-child:update-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other dental benefits click"
              >
                {t('renew-adult-child:update-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Access to other dental benefits click">
                {t('renew-adult-child:update-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Access to other dental benefits click"
              >
                {t('renew-adult-child:update-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

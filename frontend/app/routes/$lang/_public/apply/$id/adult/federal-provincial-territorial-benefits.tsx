import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { loadApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeAndSortFederalSocialPrograms, localizeAndSortProvincialTerritorialSocialPrograms, localizeAndSortRegions } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum HasFederalBenefitsOption {
  No = 'no',
  Yes = 'yes',
}

enum HasProvincialTerritorialBenefitsOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.federalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply-adult:dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const { CANADA_COUNTRY_ID } = getEnv();

  const lookupService = getLookupService();
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = localizeAndSortFederalSocialPrograms(lookupService.getAllFederalSocialPrograms(), locale);
  const provincialTerritorialSocialPrograms = localizeAndSortProvincialTerritorialSocialPrograms(lookupService.getAllProvincialTerritorialSocialPrograms(), locale);
  const allRegions = localizeAndSortRegions(lookupService.getAllRegions(), locale);
  const regions = allRegions.filter((region) => region.countryId === CANADA_COUNTRY_ID);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:dental-benefits.title') }) };

  return json({
    csrfToken,
    defaultState: state.dentalBenefits,
    editMode: state.editMode,
    federalSocialPrograms,
    id: state.id,
    meta,
    provincialTerritorialSocialPrograms,
    regions,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult/federal-provincial-territorial');

  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ errorMap: () => ({ message: t('apply-adult:dental-benefits.error-message.federal-benefit-required') }) }),
      federalSocialProgram: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits) {
        if (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
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
      hasProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('apply-adult:dental-benefits.error-message.provincial-benefit-required') }) }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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
        ...(!parsedFederalBenefitsResult.success ? parsedFederalBenefitsResult.error.format() : {}),
        ...(!parsedProvincialTerritorialBenefitsResult.success ? parsedProvincialTerritorialBenefitsResult.error.format() : {}),
      },
    });
  }

  saveApplyState({
    params,
    session,
    state: {
      dentalBenefits: {
        ...parsedFederalBenefitsResult.data,
        ...parsedProvincialTerritorialBenefitsResult.data,
      },
      editMode: true, // last step in the flow
    },
  });

  return redirect(getPathById('$lang/_public/apply/$id/adult/review-information', params));
}

export default function AccessToDentalInsuranceQuestion() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, federalSocialPrograms, provincialTerritorialSocialPrograms, regions, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(defaultState?.hasFederalBenefits);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(defaultState?.hasProvincialTerritorialBenefits);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState?.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState?.province);
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-has-federal-benefits-option-0': fetcher.data?.errors.hasFederalBenefits?._errors[0],
      'input-radio-federal-social-programs-option-0': fetcher.data?.errors.federalSocialProgram?._errors[0],
      'input-radio-has-provincial-territorial-benefits-option-0': fetcher.data?.errors.hasProvincialTerritorialBenefits?._errors[0],
      province: fetcher.data?.errors.province?._errors[0],
      'input-radio-provincial-territorial-social-programs-option-0': fetcher.data?.errors.provincialTerritorialSocialProgram?._errors[0],
    }),
    [
      fetcher.data?.errors.hasFederalBenefits?._errors,
      fetcher.data?.errors.federalSocialProgram?._errors,
      fetcher.data?.errors.province?._errors,
      fetcher.data?.errors.hasProvincialTerritorialBenefits?._errors,
      fetcher.data?.errors.provincialTerritorialSocialProgram?._errors,
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

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
        <Progress value={88} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-adult:dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('apply-adult:dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:dental-benefits.federal-benefits.title')}</legend>
            <InputRadios
              id="has-federal-benefits"
              name="hasFederalBenefits"
              legend={t('apply-adult:dental-benefits.federal-benefits.legend')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.federal-benefits.option-no" />,
                  value: HasFederalBenefitsOption.No,
                  defaultChecked: hasFederalBenefitValue === false,
                  onChange: handleOnHasFederalBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.federal-benefits.option-yes" />,
                  value: HasFederalBenefitsOption.Yes,
                  defaultChecked: hasFederalBenefitValue === true,
                  onChange: handleOnHasFederalBenefitChanged,
                  append: hasFederalBenefitValue === true && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={t('apply-adult:dental-benefits.federal-benefits.social-programs.legend')}
                      legendClassName="font-normal"
                      options={federalSocialPrograms.map((option) => ({
                        children: option.name,
                        defaultChecked: defaultState?.federalSocialProgram === option.id,
                        value: option.id,
                      }))}
                      errorMessage={errorMessages['input-radio-federal-social-programs-option-0']}
                      required
                    />
                  ),
                },
              ]}
              errorMessage={errorMessages['input-radio-has-federal-benefits-option-0']}
              required
            />
          </fieldset>
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:dental-benefits.provincial-territorial-benefits.title')}</legend>
            <InputRadios
              id="has-provincial-territorial-benefits"
              name="hasProvincialTerritorialBenefits"
              legend={t('apply-adult:dental-benefits.provincial-territorial-benefits.legend')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.provincial-territorial-benefits.option-no" />,
                  value: HasProvincialTerritorialBenefitsOption.No,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === false,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.provincial-territorial-benefits.option-yes" />,
                  value: HasProvincialTerritorialBenefitsOption.Yes,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === true,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  append: hasProvincialTerritorialBenefitValue === true && (
                    <div className="space-y-6">
                      <InputSelect
                        id="province"
                        name="province"
                        className="w-full sm:w-1/2"
                        label={t('apply-adult:dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                        onChange={handleOnRegionChanged}
                        options={[
                          { children: t('apply-adult:dental-benefits.select-one'), value: '', hidden: true },
                          ...regions.map((region) => ({
                            id: region.provinceTerritoryStateId,
                            value: region.provinceTerritoryStateId,
                            children: region.name,
                          })),
                        ]}
                        defaultValue={provinceValue}
                        errorMessage={errorMessages['province']}
                        required
                      />
                      {provinceValue && (
                        <InputRadios
                          id="provincial-territorial-social-programs"
                          name="provincialTerritorialSocialProgram"
                          legend={t('apply-adult:dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
                          legendClassName="font-normal"
                          errorMessage={errorMessages['input-radio-provincial-territorial-social-programs-option-0']}
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
              errorMessage={errorMessages['input-radio-has-provincial-territorial-benefits-option-0']}
              required
            />
          </fieldset>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Access to other dental benefits click">
                {t('apply-adult:dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang/_public/apply/$id/adult/review-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Access to other dental benefits click"
              >
                {t('apply-adult:dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other dental benefits click">
                {t('apply-adult:dental-benefits.button.continue')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang/_public/apply/$id/adult/dental-insurance"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other dental benefits click"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult:dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

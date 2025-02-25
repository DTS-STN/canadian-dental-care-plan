import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/apply-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  submit: 'submit',
  hasBenefits: 'hasBenefits',
  back: 'back',
} as const;

const HAS_FEDERAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

const HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

const HAS_FEDERAL_PROVINCIAL_TERRITORIAL_BENEFITS = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.federalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply-adult:dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const provinceTerritoryStates = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStatesByCountryId(CANADA_COUNTRY_ID, locale);
  const provincialTerritorialSocialPrograms = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:dental-benefits.title') }) };

  return {
    defaultState: state.dentalBenefits,
    editMode: state.editMode,
    federalSocialPrograms,
    id: state.id,
    meta,
    provincialTerritorialSocialPrograms,
    provinceTerritoryStates,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  if (formAction === FORM_ACTION.back) return { hasFederalProvincialTerritorialBenefits: false };

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalProvincialTerritorialBenefitsSchema =
    formAction === FORM_ACTION.hasBenefits
      ? z.object({
          hasFederalProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('apply-adult:dental-benefits.error-message.federal-provincial-territorial-benefit-required') }) }),
        })
      : z.object({
          hasFederalProvincialTerritorialBenefits: z.boolean().optional(),
        });

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

  const dentalBenefits =
    formAction === FORM_ACTION.hasBenefits
      ? {
          hasFederalProvincialTerritorialBenefits: formData.get('hasFederalProvincialTerritorialBenefits') ? formData.get('hasFederalProvincialTerritorialBenefits') === HAS_FEDERAL_PROVINCIAL_TERRITORIAL_BENEFITS.yes : undefined,
          hasFederalBenefits: false,
          federalSocialProgram: undefined,
          hasProvincialTerritorialBenefits: false,
          provincialTerritorialSocialProgram: undefined,
          province: undefined,
        }
      : {
          hasFederalProvincialTerritorialBenefits: true,
          hasFederalBenefits: formData.get('hasFederalBenefits') ? formData.get('hasFederalBenefits') === HAS_FEDERAL_BENEFITS_OPTION.yes : undefined,
          federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
          hasProvincialTerritorialBenefits: formData.get('hasProvincialTerritorialBenefits') ? formData.get('hasProvincialTerritorialBenefits') === HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes : undefined,
          provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
          province: formData.get('province') ? String(formData.get('province')) : undefined,
        };

  const parsedFederalProvincialTerritorialBenefitsResult = federalProvincialTerritorialBenefitsSchema.safeParse(dentalBenefits);
  const parsedFederalBenefitsResult = federalBenefitsSchema.safeParse(dentalBenefits);
  const parsedProvincialTerritorialBenefitsResult = provincialTerritorialBenefitsSchema.safeParse(dentalBenefits);

  if (!parsedFederalProvincialTerritorialBenefitsResult.success || !parsedFederalBenefitsResult.success || !parsedProvincialTerritorialBenefitsResult.success) {
    return {
      errors: {
        ...(!parsedFederalProvincialTerritorialBenefitsResult.success ? transformFlattenedError(parsedFederalProvincialTerritorialBenefitsResult.error.flatten()) : {}),
        ...(!parsedFederalBenefitsResult.success ? transformFlattenedError(parsedFederalBenefitsResult.error.flatten()) : {}),
        ...(!parsedProvincialTerritorialBenefitsResult.success ? transformFlattenedError(parsedProvincialTerritorialBenefitsResult.error.flatten()) : {}),
      },
      hasFederalProvincialTerritorialBenefits: parsedFederalProvincialTerritorialBenefitsResult.data?.hasFederalProvincialTerritorialBenefits,
    };
  }

  if (formAction === FORM_ACTION.hasBenefits && parsedFederalProvincialTerritorialBenefitsResult.data.hasFederalProvincialTerritorialBenefits) return { hasFederalProvincialTerritorialBenefits: true };

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

  return redirect(getPathById('public/apply/$id/adult/review-information', params));
}

export default function AccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provinceTerritoryStates, defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(defaultState?.hasFederalBenefits);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(defaultState?.hasProvincialTerritorialBenefits);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState?.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState?.province);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasFederalProvincialTerritorialBenefits: 'input-radio-has-federal-provincial-territorial-benefits-option-0',
    hasFederalBenefits: 'input-radio-has-federal-benefits-option-0',
    federalSocialProgram: 'input-radio-federal-social-programs-option-0',
    hasProvincialTerritorialBenefits: 'input-radio-has-provincial-territorial-benefits-option-0',
    province: 'province',
    provincialTerritorialSocialProgram: 'input-radio-provincial-territorial-social-programs-option-0',
  });

  const hasFederalProvincialTerritorialBenefits = fetcher.data?.hasFederalProvincialTerritorialBenefits;

  function handleOnHasFederalBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasFederalBenefitValue(e.target.value === HAS_FEDERAL_BENEFITS_OPTION.yes);
  }

  function handleOnHasProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasProvincialTerritorialBenefitValue(e.target.value === HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes);
    if (e.target.value !== HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes) {
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

  if (!hasFederalProvincialTerritorialBenefits)
    return (
      <>
        <div className="my-6 sm:my-8">
          <Progress value={88} size="lg" label={t('apply:progress.label')} />
        </div>
        <div className="max-w-prose">
          <p className="mb-4">{t('apply-adult:dental-benefits.access-to-dental')}</p>
          <p className="mb-4">{t('apply-adult:dental-benefits.eligibility-criteria')}</p>
          <p className="mb-4 italic">{t('apply:required-label')}</p>
          <errorSummary.ErrorSummary />
          <fetcher.Form method="post" noValidate>
            <CsrfTokenInput />
            <fieldset className="mb-6">
              <InputRadios
                id="has-federal-provincial-territorial-benefits"
                name="hasFederalProvincialTerritorialBenefits"
                legend={t('apply-adult:dental-benefits.federal-provincial-territorial-benefits.legend')}
                options={[
                  { value: HAS_FEDERAL_PROVINCIAL_TERRITORIAL_BENEFITS.yes, children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-benefits.federal-provincial-territorial-benefits.option-yes" /> },
                  { value: HAS_FEDERAL_PROVINCIAL_TERRITORIAL_BENEFITS.no, children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-benefits.federal-provincial-territorial-benefits.option-no" /> },
                ]}
                errorMessage={errors?.hasFederalProvincialTerritorialBenefits}
                required
              />
            </fieldset>
            {editMode ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  name="_action"
                  variant="primary"
                  id="continue-button"
                  value={FORM_ACTION.hasBenefits}
                  //onClick={() => handleHasFederalProvincialTerritorialBenefits()}
                  disabled={isSubmitting}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Access to other dental benefits click"
                >
                  {t('apply-adult:dental-benefits.button.save-btn')}
                </Button>
                <ButtonLink
                  id="back-button"
                  routeId="public/apply/$id/adult/review-information"
                  params={params}
                  disabled={isSubmitting}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Access to other dental benefits click"
                >
                  {t('apply-adult:dental-benefits.button.cancel-btn')}
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <LoadingButton
                  name="_action"
                  variant="primary"
                  id="continue-button"
                  value={FORM_ACTION.hasBenefits}
                  //onClick={() => handleHasFederalProvincialTerritorialBenefits()}
                  loading={isSubmitting}
                  endIcon={faChevronRight}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other dental benefits click"
                >
                  {t('apply-adult:dental-benefits.button.continue')}
                </LoadingButton>
                <ButtonLink
                  id="back-button"
                  routeId="public/apply/$id/adult/dental-insurance"
                  params={params}
                  disabled={isSubmitting}
                  startIcon={faChevronLeft}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other dental benefits click"
                >
                  {t('apply-adult:dental-benefits.button.back')}
                </ButtonLink>
              </div>
            )}
          </fetcher.Form>
        </div>
      </>
    );
  else
    return (
      <>
        <div className="my-6 sm:my-8">
          <Progress value={88} size="lg" label={t('apply:progress.label')} />
        </div>
        <div className="max-w-prose">
          <p className="mb-4">{t('apply-adult:dental-benefits.access-to-dental')}</p>
          <p className="mb-4">{t('apply-adult:dental-benefits.eligibility-criteria')}</p>
          <p className="mb-4 italic">{t('apply:required-label')}</p>
          <errorSummary.ErrorSummary />
          <fetcher.Form method="post" noValidate>
            <CsrfTokenInput />
            <fieldset className="mb-6">
              <legend className="font-lato mb-4 text-2xl font-bold">{t('apply-adult:dental-benefits.federal-benefits.title')}</legend>
              <InputRadios
                id="has-federal-benefits"
                name="hasFederalBenefits"
                legend={t('apply-adult:dental-benefits.federal-benefits.legend')}
                options={[
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.federal-benefits.option-no" />,
                    value: HAS_FEDERAL_BENEFITS_OPTION.no,
                    onChange: handleOnHasFederalBenefitChanged,
                  },
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.federal-benefits.option-yes" />,
                    value: HAS_FEDERAL_BENEFITS_OPTION.yes,
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
              <legend className="font-lato mb-4 text-2xl font-bold">{t('apply-adult:dental-benefits.provincial-territorial-benefits.title')}</legend>
              <InputRadios
                id="has-provincial-territorial-benefits"
                name="hasProvincialTerritorialBenefits"
                legend={t('apply-adult:dental-benefits.provincial-territorial-benefits.legend')}
                options={[
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.provincial-territorial-benefits.option-no" />,
                    value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.no,
                    onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  },
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:dental-benefits.provincial-territorial-benefits.option-yes" />,
                    value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
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
                            {
                              children: t('apply-adult:dental-benefits.select-one'),
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
                            legend={t('apply-adult:dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                <Button name="_action" variant="primary" id="continue-button" value={FORM_ACTION.submit} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Access to other dental benefits click">
                  {t('apply-adult:dental-benefits.button.save-btn')}
                </Button>
                <Button name="_action" id="back-button" value={FORM_ACTION.back} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Access to other dental benefits click">
                  {t('apply-adult:dental-benefits.button.cancel-btn')}
                </Button>
              </div>
            ) : (
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <LoadingButton
                  name="_action"
                  variant="primary"
                  id="continue-button"
                  value={FORM_ACTION.submit}
                  loading={isSubmitting}
                  endIcon={faChevronRight}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other dental benefits click"
                >
                  {t('apply-adult:dental-benefits.button.continue')}
                </LoadingButton>
                <Button name="_action" id="back-button" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other dental benefits click">
                  {t('apply-adult:dental-benefits.button.back')}
                </Button>
              </div>
            )}
          </fetcher.Form>
        </div>
      </>
    );
}

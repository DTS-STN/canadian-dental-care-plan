import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { isInvitationToApplyClient, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { ProtectedDentalFederalBenefitsState, ProtectedDentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  save: 'save',
} as const;

const HAS_FEDERAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

const HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'protected-renew:update-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });

  if (!isInvitationToApplyClient(state.clientApplication) && !state.editMode) {
    throw new Response('Not Found', { status: 404 });
  }

  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const federalSocialPrograms = await federalGovernmentInsurancePlanService.listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const provinceTerritoryStates = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStatesByCountryId(CANADA_COUNTRY_ID, locale);
  const provincialTerritorialSocialPrograms = await provincialGovernmentInsurancePlanService.listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:update-dental-benefits.title') }) };

  const clientDentalBenefits = (await state.clientApplication.dentalBenefits.reduce(async (benefitsPromise, id) => {
    const benefits = await benefitsPromise;

    const federalProgram = await federalGovernmentInsurancePlanService.findFederalGovernmentInsurancePlanById(id);
    if (federalProgram.isSome()) {
      return {
        ...benefits,
        hasFederalBenefits: true,
        federalSocialProgram: id,
      };
    }

    const provincialProgram = await provincialGovernmentInsurancePlanService.findProvincialGovernmentInsurancePlanById(id);
    if (provincialProgram.isSome()) {
      return {
        ...benefits,
        hasProvincialTerritorialBenefits: true,
        provincialTerritorialSocialProgram: id,
        province: provincialProgram.unwrap().provinceTerritoryStateId,
      };
    }

    return benefits;
  }, Promise.resolve({}))) as ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;

  const dentalBenefits = state.dentalBenefits ?? (isInvitationToApplyClient(state.clientApplication) ? undefined : clientDentalBenefits);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.renew.confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  return {
    defaultState: dentalBenefits,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    provinceTerritoryStates,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ error: t('protected-renew:update-dental-benefits.error-message.federal-benefit-required') }),
      federalSocialProgram: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits && (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram))) {
        ctx.addIssue({ code: 'custom', message: t('protected-renew:update-dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
      }
    })
    .transform((val) => {
      return {
        ...val,
        federalSocialProgram: val.hasFederalBenefits ? val.federalSocialProgram : undefined,
      };
    }) satisfies z.ZodType<ProtectedDentalFederalBenefitsState>;

  const provincialTerritorialBenefitsSchema = z
    .object({
      hasProvincialTerritorialBenefits: z.boolean({ error: t('protected-renew:update-dental-benefits.error-message.provincial-benefit-required') }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: 'custom', message: t('protected-renew:update-dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: 'custom', message: t('protected-renew:update-dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
        }
      }
    })
    .transform((val) => {
      return {
        ...val,
        province: val.hasProvincialTerritorialBenefits ? val.province : undefined,
        provincialTerritorialSocialProgram: val.hasProvincialTerritorialBenefits ? val.provincialTerritorialSocialProgram : undefined,
      };
    }) satisfies z.ZodType<ProtectedDentalProvincialTerritorialBenefitsState>;

  const dentalFederalBenefits = {
    hasFederalBenefits: formData.get('hasFederalBenefits') ? formData.get('hasFederalBenefits') === HAS_FEDERAL_BENEFITS_OPTION.yes : undefined,
    federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
  };

  const dentalProvincialTerritorialBenefits = {
    hasProvincialTerritorialBenefits: formData.get('hasProvincialTerritorialBenefits') ? formData.get('hasProvincialTerritorialBenefits') === HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes : undefined,
    provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
    province: formData.get('province') ? String(formData.get('province')) : undefined,
  };

  const parsedFederalBenefitsResult = federalBenefitsSchema.safeParse(dentalFederalBenefits);
  const parsedProvincialTerritorialBenefitsResult = provincialTerritorialBenefitsSchema.safeParse(dentalProvincialTerritorialBenefits);

  if (!parsedFederalBenefitsResult.success || !parsedProvincialTerritorialBenefitsResult.success) {
    return data(
      {
        errors: {
          ...(parsedFederalBenefitsResult.success ? {} : transformFlattenedError(z.flattenError(parsedFederalBenefitsResult.error))),
          ...(parsedProvincialTerritorialBenefitsResult.success ? {} : transformFlattenedError(z.flattenError(parsedProvincialTerritorialBenefitsResult.error))),
        },
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      dentalBenefits: {
        ...parsedFederalBenefitsResult.data,
        ...parsedProvincialTerritorialBenefitsResult.data,
      },
      previouslyReviewed: true,
    },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.renew.confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  if (demographicSurveyEnabled) {
    return redirect(getPathById('protected/renew/$id/demographic-survey', params));
  }

  return redirect(getPathById('protected/renew/$id/member-selection', params));
}

export default function ProtectedRenewConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
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
    hasFederalBenefits: 'input-radio-has-federal-benefits-option-0',
    federalSocialProgram: 'input-radio-federal-social-programs-option-0',
    hasProvincialTerritorialBenefits: 'input-radio-has-provincial-territorial-benefits-option-0',
    province: 'province',
    provincialTerritorialSocialProgram: 'input-radio-provincial-territorial-social-programs-option-0',
  });

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

  return (
    <div className="max-w-prose">
      <p className="mb-4">{t('protected-renew:update-dental-benefits.access-to-dental')}</p>
      <p className="mb-4">{t('protected-renew:update-dental-benefits.eligibility-criteria')}</p>
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-renew:update-dental-benefits.federal-benefits.title')}</legend>
          <InputRadios
            id="has-federal-benefits"
            name="hasFederalBenefits"
            legend={t('protected-renew:update-dental-benefits.federal-benefits.legend')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:update-dental-benefits.federal-benefits.option-yes" />,
                value: HAS_FEDERAL_BENEFITS_OPTION.yes,
                defaultChecked: hasFederalBenefitValue === true,
                onChange: handleOnHasFederalBenefitChanged,
                append: hasFederalBenefitValue === true && (
                  <InputRadios
                    id="federal-social-programs"
                    name="federalSocialProgram"
                    legend={t('protected-renew:update-dental-benefits.federal-benefits.social-programs.legend')}
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
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:update-dental-benefits.federal-benefits.option-no" />,
                value: HAS_FEDERAL_BENEFITS_OPTION.no,
                defaultChecked: hasFederalBenefitValue === false,
                onChange: handleOnHasFederalBenefitChanged,
              },
            ]}
            errorMessage={errors?.hasFederalBenefits}
            required
          />
        </fieldset>
        <fieldset className="mb-8">
          <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-renew:update-dental-benefits.provincial-territorial-benefits.title')}</legend>
          <InputRadios
            id="has-provincial-territorial-benefits"
            name="hasProvincialTerritorialBenefits"
            legend={t('protected-renew:update-dental-benefits.provincial-territorial-benefits.legend')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:update-dental-benefits.provincial-territorial-benefits.option-yes" />,
                value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
                defaultChecked: hasProvincialTerritorialBenefitValue === true,
                onChange: handleOnHasProvincialTerritorialBenefitChanged,
                append: hasProvincialTerritorialBenefitValue && (
                  <div className="space-y-6">
                    <InputSelect
                      id="province"
                      name="province"
                      className="w-full sm:w-1/2"
                      label={t('protected-renew:update-dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                      onChange={handleOnRegionChanged}
                      options={[
                        {
                          children: t('protected-renew:update-dental-benefits.select-one'),
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
                        legend={t('protected-renew:update-dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:update-dental-benefits.provincial-territorial-benefits.option-no" />,
                value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.no,
                defaultChecked: defaultState?.hasProvincialTerritorialBenefits === false,
                onChange: handleOnHasProvincialTerritorialBenefitChanged,
              },
            ]}
            errorMessage={errors?.hasProvincialTerritorialBenefits}
            required
          />
        </fieldset>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <LoadingButton
              id="save-button"
              name="_action"
              value={FORM_ACTION.save}
              variant="primary"
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-renew:update-dental-benefits.button.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="cancel-button"
              routeId="protected/renew/$id/review-adult-information"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-renew:update-dental-benefits.button.cancel-btn')}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              variant="primary"
              id="continue-button"
              disabled={isSubmitting}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-renew:update-dental-benefits.button.continue')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/dental-insurance"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-renew:update-dental-benefits.button.back')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

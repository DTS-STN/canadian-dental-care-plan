import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewSingleChildState, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { ProtectedDentalFederalBenefitsState, ProtectedDentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { AppPageTitle } from '~/components/layouts/protected-layout';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

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
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadProtectedRenewSingleChildState({ params, request, session });
  const renewState = loadProtectedRenewState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const childNumber = t('protected-renew:children.child-number', { childNumber: state.childNumber });
  const childName = state.isNew ? childNumber : (state.information?.firstName ?? childNumber);

  const federalSocialPrograms = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const provinceTerritoryStates = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStatesByCountryId(CANADA_COUNTRY_ID, locale);
  const provincialTerritorialSocialPrograms = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-renew:children.update-dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-renew:children.update-dental-benefits.title', { childName: childNumber }) }),
  };

  const immutableChild = renewState.clientApplication.children.find((c) => c.information.socialInsuranceNumber === state.information?.socialInsuranceNumber);
  const clientDentalBenefits = immutableChild?.dentalBenefits.reduce((benefits, id) => {
    const federalProgram = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).findFederalGovernmentInsurancePlanById(id);
    if (federalProgram) {
      return {
        ...benefits,
        hasFederalBenefits: true,
        federalSocialProgram: id,
      };
    }

    const provincialProgram = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).findProvincialGovernmentInsurancePlanById(id);
    if (provincialProgram) {
      return {
        ...benefits,
        hasProvincialTerritorialBenefits: true,
        provincialTerritorialSocialProgram: id,
        province: provincialProgram.provinceTerritoryStateId,
      };
    }

    return benefits;
  }, {}) as ProtectedDentalFederalBenefitsState & ProtectedDentalProvincialTerritorialBenefitsState;

  const dentalBenefits = state.dentalBenefits ?? clientDentalBenefits;

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.child-confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.renew.children.confirm-federal-provincial-territorial-benefits', 200);

  return {
    defaultState: dentalBenefits,
    childName,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    provinceTerritoryStates,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewSingleChildState({ params, request, session });
  const renewState = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ errorMap: () => ({ message: t('protected-renew:children.update-dental-benefits.error-message.federal-benefit-required') }) }),
      federalSocialProgram: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits) {
        if (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:children.update-dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
        }
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
      hasProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('protected-renew:children.update-dental-benefits.error-message.provincial-benefit-required') }) }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:children.update-dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:children.update-dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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
    instrumentationService.countHttpStatus('protected.renew.children.confirm-federal-provincial-territorial-benefits', 400);
    return data(
      {
        errors: {
          ...(!parsedFederalBenefitsResult.success ? transformFlattenedError(parsedFederalBenefitsResult.error.flatten()) : {}),
          ...(!parsedProvincialTerritorialBenefitsResult.success ? transformFlattenedError(parsedProvincialTerritorialBenefitsResult.error.flatten()) : {}),
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
      children: renewState.children.map((child) => {
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

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.child-confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.renew.children.confirm-federal-provincial-territorial-benefits', 302);
  return redirect(getPathById('protected/renew/$id/review-child-information', params));
}

export default function ProtectedRenewConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provinceTerritoryStates, defaultState, childName } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(defaultState.hasFederalBenefits);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(defaultState.hasProvincialTerritorialBenefits);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState.province);

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
    <>
      <AppPageTitle>{t('protected-renew:children.update-dental-benefits.title', { childName })}</AppPageTitle>
      <div className="max-w-prose">
        <p className="mb-4">{t('protected-renew:children.update-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('protected-renew:children.update-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />

          <fieldset className="mb-6">
            <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-renew:children.update-dental-benefits.federal-benefits.title')}</legend>
            <InputRadios
              id="has-federal-benefits"
              name="hasFederalBenefits"
              legend={t('protected-renew:children.update-dental-benefits.federal-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.update-dental-benefits.federal-benefits.option-yes" />,
                  value: HAS_FEDERAL_BENEFITS_OPTION.yes,
                  defaultChecked: hasFederalBenefitValue === true,
                  onChange: handleOnHasFederalBenefitChanged,
                  append: hasFederalBenefitValue === true && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={t('protected-renew:children.update-dental-benefits.federal-benefits.social-programs.legend')}
                      legendClassName="font-normal"
                      options={federalSocialPrograms.map((option) => ({
                        children: option.name,
                        defaultChecked: defaultState.federalSocialProgram === option.id,
                        value: option.id,
                      }))}
                      errorMessage={errors?.federalSocialProgram}
                      required
                    />
                  ),
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.update-dental-benefits.federal-benefits.option-no" />,
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
            <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-renew:children.update-dental-benefits.provincial-territorial-benefits.title')}</legend>
            <InputRadios
              id="has-provincial-territorial-benefits"
              name="hasProvincialTerritorialBenefits"
              legend={t('protected-renew:children.update-dental-benefits.provincial-territorial-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.update-dental-benefits.provincial-territorial-benefits.option-yes" />,
                  value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
                  defaultChecked: hasProvincialTerritorialBenefitValue === true,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  append: hasProvincialTerritorialBenefitValue && (
                    <div className="space-y-6">
                      <InputSelect
                        id="province"
                        name="province"
                        className="w-full sm:w-1/2"
                        label={t('protected-renew:children.update-dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                        onChange={handleOnRegionChanged}
                        options={[
                          {
                            children: t('protected-renew:children.update-dental-benefits.select-one'),
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
                          legend={t('protected-renew:children.update-dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.update-dental-benefits.provincial-territorial-benefits.option-no" />,
                  value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.no,
                  defaultChecked: defaultState.hasProvincialTerritorialBenefits === false,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                },
              ]}
              errorMessage={errors?.hasProvincialTerritorialBenefits}
              required
            />
          </fieldset>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Child access to other federal, provincial or territorial dental benefits click">
              {t('protected-renew:children.update-dental-benefits.button.save-btn')}
            </Button>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/review-child-information"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Child access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-renew:children.update-dental-benefits.button.cancel-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

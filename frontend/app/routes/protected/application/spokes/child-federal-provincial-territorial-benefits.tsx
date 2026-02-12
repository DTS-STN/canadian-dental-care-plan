import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/child-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, getSingleChildState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.childFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'protected-application-spokes:children.dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => {
  return getTitleMetaTags(loaderData.meta.title, loaderData.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-children', 'full-family', 'simplified-children', 'simplified-family']);
  const childState = getSingleChildState({ params, request, session });

  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const allRegions = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);
  const provincialTerritorialSocialPrograms = await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);
  const regions = allRegions.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);

  const childNumber = t('protected-application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:children.dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-application-spokes:children.dental-benefits.title', { childName: childNumber }) }),
  };

  return {
    defaultState: childState.dentalBenefits?.value,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    regions,
    childName,
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}` as const,
    i18nOptions: { childName },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-children', 'full-family', 'simplified-children', 'simplified-family']);

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });

  const childState = getSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ error: t('protected-application-spokes:children.dental-benefits.error-message.federal-benefit-required') }),
      federalSocialProgram: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits && (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram))) {
        ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:children.dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
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
      hasProvincialTerritorialBenefits: z.boolean({ error: t('protected-application-spokes:children.dental-benefits.error-message.provincial-benefit-required') }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:children.dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:children.dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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

  const dentalBenefits = {
    hasFederalBenefits: formData.get('hasFederalBenefits') ? formData.get('hasFederalBenefits') === HAS_FEDERAL_BENEFITS_OPTION.yes : undefined,
    federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
    hasProvincialTerritorialBenefits: formData.get('hasProvincialTerritorialBenefits') ? formData.get('hasProvincialTerritorialBenefits') === HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes : undefined,
    provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
    province: formData.get('province') ? String(formData.get('province')) : undefined,
  };

  const parsedFederalBenefitsResult = federalBenefitsSchema.safeParse(dentalBenefits);
  const parsedProvincialTerritorialBenefitsResult = provincialTerritorialBenefitsSchema.safeParse(dentalBenefits);

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

  saveProtectedApplicationState({
    params,
    session,
    state: {
      children: state.children.map((child) => {
        if (child.id !== childState.id) return child;
        return {
          ...child,
          dentalBenefits: {
            hasChanged: true,
            value: {
              ...parsedFederalBenefitsResult.data,
              ...parsedProvincialTerritorialBenefitsResult.data,
            },
          },
        };
      }),
    },
  });

  return redirect(getPathById(`protected/application/$id/${state.inputModel}-${state.typeOfApplication}/childrens-application`, params));
}

export default function ChildFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, regions, defaultState, childName, applicationFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(defaultState?.hasFederalBenefits);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(defaultState?.hasProvincialTerritorialBenefits);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState?.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState?.province);

  const errors = fetcher.data?.errors;

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
    <ErrorSummaryProvider actionData={fetcher.data}>
      <div className="max-w-prose">
        <p className="mb-4">{t('protected-application-spokes:children.dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('protected-application-spokes:children.dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('protected-application:required-label')}</p>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-application-spokes:children.dental-benefits.federal-benefits.title', { childName })}</legend>
            <InputRadios
              id="has-federal-benefits"
              name="hasFederalBenefits"
              legend={t('protected-application-spokes:children.dental-benefits.federal-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:children.dental-benefits.federal-benefits.option-yes" />,
                  value: HAS_FEDERAL_BENEFITS_OPTION.yes,
                  defaultChecked: hasFederalBenefitValue === true,
                  onChange: handleOnHasFederalBenefitChanged,
                  append: hasFederalBenefitValue === true && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={t('protected-application-spokes:children.dental-benefits.federal-benefits.social-programs.legend')}
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
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:children.dental-benefits.federal-benefits.option-no" />,
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
            <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.title')}</legend>
            <InputRadios
              id="has-provincial-territorial-benefits"
              name="hasProvincialTerritorialBenefits"
              legend={t('protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.legend', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.option-yes" />,
                  value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === true,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                  append: hasProvincialTerritorialBenefitValue === true && (
                    <div className="space-y-6">
                      <InputSelect
                        id="province"
                        name="province"
                        className="w-full sm:w-1/2"
                        label={t('protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                        onChange={handleOnRegionChanged}
                        options={[
                          {
                            children: t('protected-application-spokes:children.dental-benefits.select-one'),
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
                          legend={t('protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:children.dental-benefits.provincial-territorial-benefits.option-no" />,
                  value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.no,
                  defaultChecked: defaultState?.hasProvincialTerritorialBenefits === false,
                  onChange: handleOnHasProvincialTerritorialBenefitChanged,
                },
              ]}
              errorMessage={errors?.hasProvincialTerritorialBenefits}
              required
            />
          </fieldset>

          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              variant="primary"
              id="save-button"
              loading={isSubmitting}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Application Form-Child:Save - Child access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-application-spokes:children.dental-benefits.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`protected/application/$id/${applicationFlow}/childrens-application`}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Application Form-Child:Back - Child access to other federal, provincial or territorial dental benefits click"
            >
              {t('protected-application-spokes:children.dental-benefits.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </ErrorSummaryProvider>
  );
}

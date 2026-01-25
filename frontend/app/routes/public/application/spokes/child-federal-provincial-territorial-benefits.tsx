import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/child-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getPublicApplicationState, getSingleChildState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
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

const HAS_FEDERAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

const HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.childFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'application-spokes:children.dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => {
  return getTitleMetaTags(loaderData.meta.title, loaderData.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children', 'new-family', 'renew-children']);
  const childState = getSingleChildState({ params, request, session });

  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.ClientConfig);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalSocialPrograms = await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const allRegions = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);
  const provincialTerritorialSocialPrograms = await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);
  const regions = allRegions.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);

  const childNumber = t('application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('application-spokes:children.dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('application-spokes:children.dental-benefits.title', { childName: childNumber }) }),
  };

  return {
    defaultState: childState.dentalBenefits?.value,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    regions,
    childName,
    typeAndFlow: `${state.typeOfApplication}-${state.typeOfApplicationFlow}`,
    i18nOptions: { childName },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children', 'new-family', 'renew-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const childState = getSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ error: t('application-spokes:children.dental-benefits.error-message.federal-benefit-required') }),
      federalSocialProgram: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits && (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram))) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:children.dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
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
      hasProvincialTerritorialBenefits: z.boolean({ error: t('application-spokes:children.dental-benefits.error-message.provincial-benefit-required') }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:children.dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:children.dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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

  savePublicApplicationState({
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

  return redirect(getPathById(`public/application/$id/${state.typeOfApplication}-${state.typeOfApplicationFlow}/childrens-application`, params));
}

export default function SpokeChildAccessToDentalDentalBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, regions, defaultState, childName, typeAndFlow } = loaderData;

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
      <p className="mb-4">{t('application-spokes:children.dental-benefits.access-to-dental')}</p>
      <p className="mb-4">{t('application-spokes:children.dental-benefits.eligibility-criteria')}</p>
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <legend className="font-lato mb-4 text-2xl font-bold">{t('application-spokes:children.dental-benefits.federal-benefits.title', { childName })}</legend>
          <InputRadios
            id="has-federal-benefits"
            name="hasFederalBenefits"
            legend={t('application-spokes:children.dental-benefits.federal-benefits.legend', { childName })}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.dental-benefits.federal-benefits.option-yes" />,
                value: HAS_FEDERAL_BENEFITS_OPTION.yes,
                defaultChecked: hasFederalBenefitValue === true,
                onChange: handleOnHasFederalBenefitChanged,
                append: hasFederalBenefitValue === true && (
                  <InputRadios
                    id="federal-social-programs"
                    name="federalSocialProgram"
                    legend={t('application-spokes:children.dental-benefits.federal-benefits.social-programs.legend')}
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
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.dental-benefits.federal-benefits.option-no" />,
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
          <legend className="font-lato mb-4 text-2xl font-bold">{t('application-spokes:children.dental-benefits.provincial-territorial-benefits.title')}</legend>
          <InputRadios
            id="has-provincial-territorial-benefits"
            name="hasProvincialTerritorialBenefits"
            legend={t('application-spokes:children.dental-benefits.provincial-territorial-benefits.legend', { childName })}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.dental-benefits.provincial-territorial-benefits.option-yes" />,
                value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
                defaultChecked: defaultState?.hasProvincialTerritorialBenefits === true,
                onChange: handleOnHasProvincialTerritorialBenefitChanged,
                append: hasProvincialTerritorialBenefitValue === true && (
                  <div className="space-y-6">
                    <InputSelect
                      id="province"
                      name="province"
                      className="w-full sm:w-1/2"
                      label={t('application-spokes:children.dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                      onChange={handleOnRegionChanged}
                      options={[
                        {
                          children: t('application-spokes:children.dental-benefits.select-one'),
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
                        legend={t('application-spokes:children.dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.dental-benefits.provincial-territorial-benefits.option-no" />,
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
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child access to other federal, provincial or territorial dental benefits click"
          >
            {t('application-spokes:children.dental-benefits.save-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={`public/application/$id/${typeAndFlow}/childrens-application`}
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child access to other federal, provincial or territorial dental benefits click"
          >
            {t('application-spokes:children.dental-benefits.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/edit-child-dental-benefits';

import { TYPES } from '~/.server/constants';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/apply-route-helpers';
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

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
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
  breadcrumbs: [{ labelI18nKey: 'protected-profile:dental-benefits.page-title', routeId: 'protected/profile/dental-benefits' }],
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.editChildDentalBenefits,
  pageTitleI18nKey: 'protected-profile:edit-child-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => {
  return getTitleMetaTags(loaderData.meta.title, loaderData.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const child = clientApplication.children.find((child) => child.information.clientId === params.childId);

  if (!child) {
    throw data('Not Found', { status: 404 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.ClientConfig);

  const federalSocialPrograms = await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const allRegions = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);
  const provincialTerritorialSocialPrograms = await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);
  const regions = allRegions.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);

  const federalProgram = federalSocialPrograms.find(({ id }) => child.dentalBenefits.includes(id));
  const provincialTerritorialProgram = provincialTerritorialSocialPrograms.find(({ id }) => child.dentalBenefits.includes(id));

  const childName = child.information.firstName;

  const meta = {
    title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:edit-child-dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.msca-template', { title: t('protected-profile:edit-child-dental-benefits.dc-terms-title') }),
  };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.edit-child-dental-benefits', { userId: idToken.sub });

  return {
    federalProgram,
    provincialTerritorialProgram,
    federalSocialPrograms,
    meta,
    provincialTerritorialSocialPrograms,
    regions,
    childName,
    i18nOptions: { childName },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const child = clientApplication.children.find((child) => child.information.clientId === params.childId);

  if (!child) {
    throw data('Not Found', { status: 404 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const federalBenefitsSchema = z
    .object({
      hasFederalBenefits: z.boolean({ error: t('protected-profile:edit-child-dental-benefits.error-message.federal-benefit-required') }),
      federalSocialProgram: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasFederalBenefits && (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram))) {
        ctx.addIssue({ code: 'custom', message: t('protected-profile:edit-child-dental-benefits.error-message.federal-benefit-program-required'), path: ['federalSocialProgram'] });
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
      hasProvincialTerritorialBenefits: z.boolean({ error: t('protected-profile:edit-child-dental-benefits.error-message.provincial-benefit-required') }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasProvincialTerritorialBenefits) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: 'custom', message: t('protected-profile:edit-child-dental-benefits.error-message.provincial-territorial-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: 'custom', message: t('protected-profile:edit-child-dental-benefits.error-message.provincial-benefit-program-required'), path: ['provincialTerritorialSocialProgram'] });
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

  const idToken = session.get('idToken');

  await appContainer.get(TYPES.ProfileService).updateDentalBenefits(
    {
      clientId: child.information.clientId,
      hasFederalBenefits: parsedFederalBenefitsResult.data.hasFederalBenefits,
      federalSocialProgram: parsedFederalBenefitsResult.data.federalSocialProgram,
      hasProvincialTerritorialBenefits: parsedProvincialTerritorialBenefitsResult.data.hasProvincialTerritorialBenefits,
      provincialTerritorialSocialProgram: parsedProvincialTerritorialBenefitsResult.data.provincialTerritorialSocialProgram,
    },
    idToken.sub,
  );

  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.edit-child-dental-benefits', { userId: idToken.sub });

  return redirect(getPathById('protected/profile/dental-benefits', params));
}

export default function AccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, regions, childName, federalProgram, provincialTerritorialProgram } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [hasFederalBenefitValue, setHasFederalBenefitValue] = useState(federalProgram !== undefined);
  const [hasProvincialTerritorialBenefitValue, setHasProvincialTerritorialBenefitValue] = useState(provincialTerritorialProgram !== undefined);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(provincialTerritorialProgram?.id);
  const [provinceValue, setProvinceValue] = useState(provincialTerritorialProgram?.provinceTerritoryStateId);

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
      <p className="mb-4">{t('protected-profile:edit-child-dental-benefits.access-to-dental')}</p>
      <p className="mb-4">{t('protected-profile:edit-child-dental-benefits.eligibility-criteria')}</p>
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-profile:edit-child-dental-benefits.federal-benefits.title', { childName })}</legend>
          <InputRadios
            id="has-federal-benefits"
            name="hasFederalBenefits"
            legend={t('protected-profile:edit-child-dental-benefits.federal-benefits.legend', { childName })}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-child-dental-benefits.federal-benefits.option-yes" />,
                value: HAS_FEDERAL_BENEFITS_OPTION.yes,
                defaultChecked: hasFederalBenefitValue === true,
                onChange: handleOnHasFederalBenefitChanged,
                append: hasFederalBenefitValue === true && (
                  <InputRadios
                    id="federal-social-programs"
                    name="federalSocialProgram"
                    legend={t('protected-profile:edit-child-dental-benefits.federal-benefits.social-programs.legend')}
                    legendClassName="font-normal"
                    options={federalSocialPrograms.map((option) => ({
                      children: option.name,
                      defaultChecked: federalProgram?.id === option.id,
                      value: option.id,
                    }))}
                    errorMessage={errors?.federalSocialProgram}
                    required
                  />
                ),
              },
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-child-dental-benefits.federal-benefits.option-no" />,
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
          <legend className="font-lato mb-4 text-2xl font-bold">{t('protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.title')}</legend>
          <InputRadios
            id="has-provincial-territorial-benefits"
            name="hasProvincialTerritorialBenefits"
            legend={t('protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.legend', { childName })}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.option-yes" />,
                value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.yes,
                defaultChecked: provincialTerritorialProgram !== undefined,
                onChange: handleOnHasProvincialTerritorialBenefitChanged,
                append: hasProvincialTerritorialBenefitValue === true && (
                  <div className="space-y-6">
                    <InputSelect
                      id="province"
                      name="province"
                      className="w-full sm:w-1/2"
                      label={t('protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                      onChange={handleOnRegionChanged}
                      options={[
                        {
                          children: t('protected-profile:edit-child-dental-benefits.select-one'),
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
                        legend={t('protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
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
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-child-dental-benefits.provincial-territorial-benefits.option-no" />,
                value: HAS_PROVINCIAL_TERRITORIAL_BENEFITS_OPTION.no,
                defaultChecked: provincialTerritorialProgram === undefined,
                onChange: handleOnHasProvincialTerritorialBenefitChanged,
              },
            ]}
            errorMessage={errors?.hasProvincialTerritorialBenefits}
            required
          />
        </fieldset>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" name="_action" value={FORM_ACTION.save} loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Save - Access to other dental benefits click">
            {t('protected-profile:edit-dental-benefits.button.save-btn')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/dental-benefits" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Access to other dental benefits click">
            {t('protected-profile:edit-dental-benefits.button.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

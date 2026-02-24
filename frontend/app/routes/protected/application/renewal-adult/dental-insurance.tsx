import type { JSX } from 'react';

import { data, useFetcher, useLoaderData, useParams } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationRenewalAdultState } from '~/.server/routes/helpers/protected-application-renewal-adult-route-helpers';
import { isDentalBenefitsSectionCompleted, isDentalInsuranceSectionCompleted } from '~/.server/routes/helpers/protected-application-renewal-section-checks';
import { saveProtectedApplicationState, shouldSkipMaritalStatus, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { DentalFederalBenefitsState, DentalProvincialTerritorialBenefitsState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/renewal-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-renewal-adult', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalAdult.dentalInsurance,
  pageTitleI18nKey: 'protected-application-renewal-adult:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-adult:dental-insurance.page-title') }) };

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const clientDentalBenefits = (await state.clientApplication.dentalBenefits.reduce(async (benefitsPromise, id) => {
    const benefits = await benefitsPromise;

    const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(id, locale);
    if (federalProgram.isSome()) {
      return {
        ...benefits,
        hasFederalBenefits: true,
        federalSocialProgram: federalProgram.unwrap().name,
      };
    }

    const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(id, locale);
    if (provincialProgram.isSome()) {
      return {
        ...benefits,
        hasProvincialTerritorialBenefits: true,
        provincialTerritorialSocialProgram: provincialProgram.unwrap().name,
      };
    }

    return benefits;
  }, Promise.resolve({}))) as DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.value?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.value?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  const currentDentalBenefits = state.dentalBenefits
    ? {
        hasChanged: state.dentalBenefits.hasChanged,
        federalBenefit: {
          access: state.dentalBenefits.value?.hasFederalBenefits,
          benefit: selectedFederalGovernmentInsurancePlan?.name,
        },
        provTerrBenefit: {
          access: state.dentalBenefits.value?.hasProvincialTerritorialBenefits,
          benefit: selectedProvincialBenefit?.name,
        },
      }
    : undefined;

  const sections = {
    dentalInsurance: {
      completed: isDentalInsuranceSectionCompleted(state),
    },
    dentalBenefits: {
      completed: isDentalBenefitsSectionCompleted(state),
    },
  };

  return {
    state: {
      dentalInsurance: state.dentalInsurance?.hasDentalInsurance,
      dentalBenefits: currentDentalBenefits,
    },
    shouldSkipMaritalStatusStep: shouldSkipMaritalStatus(state),
    clientApplication: {
      dentalBenefits: clientDentalBenefits.hasFederalBenefits || clientDentalBenefits.hasProvincialTerritorialBenefits ? clientDentalBenefits : undefined,
    },
    sections,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === (FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED as string)) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        dentalBenefits: { hasChanged: false },
      },
    });
  }

  return data({ success: true }, { status: 200 });
}

export default function ProtectedRenewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { sections, shouldSkipMaritalStatusStep } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="dental-insurance" excludeMaritalStatus={shouldSkipMaritalStatusStep} className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
          <p>{t('protected-application:confirm-information')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-adult:dental-insurance.access-to-dental-insurance')}</CardTitle>
            <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <DentalInsuranceCardContent />
          <DentalInsuranceCardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-adult:dental-insurance.other-benefits')}</CardTitle>
            <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <DentalBenefitsCardContent />
          <DentalBenefitsCardFooter />
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/renewal-adult/submit"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Continue click"
          >
            {t('protected-application-renewal-adult:dental-insurance.submit')}
          </NavigationButtonLink>
          <NavigationButtonLink
            variant="secondary"
            direction="previous"
            routeId="protected/application/$id/renewal-adult/contact-information"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Back click"
          >
            {t('protected-application-renewal-adult:dental-insurance.contact-information')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

/**
 * This component determines what to show in the dental insurance card content based on whether the user has
 * entered new dental insurance information, whether there is existing dental insurance information on the client
 * application, or if there is no dental insurance information at all. The logic is as follows:
 *
 * - If the user has entered new dental insurance information (state.dentalInsurance is defined), show the new value.
 *
 * - If the user has not entered new dental insurance information, show the help text to indicate they need to provide it.
 *
 * Note: Unlike other sections, there is no existing client application data for dental insurance access,
 * so we only show the help text when no selection has been made.
 */
function DentalInsuranceCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state } = useLoaderData<typeof loader>();

  if (state.dentalInsurance !== undefined) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
            <p>{state.dentalInsurance ? t('protected-application-renewal-adult:dental-insurance.dental-insurance-yes') : t('protected-application-renewal-adult:dental-insurance.dental-insurance-no')}</p>
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-renewal-adult:dental-insurance.dental-insurance-indicate-status')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the dental insurance card footer based on whether the user has
 * entered dental insurance information. The logic is as follows:
 *
 * - If the user has entered dental insurance information OR the section is completed, show the "Edit" button.
 *
 * - If the user has not entered dental insurance information, show the "Add" button.
 *
 * Note: There is no existing client application data for this section, so we only have two states.
 */
function DentalInsuranceCardFooter(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, sections } = useLoaderData<typeof loader>();
  const params = useParams();

  if (state.dentalInsurance !== undefined || sections.dentalInsurance.completed) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id="edit-button-dental-insurance"
          variant="link"
          className="p-0"
          routeId="protected/application/$id/dental-insurance"
          params={params}
          startIcon={faPenToSquare}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Edit button dental insurance click"
        >
          {t('protected-application-renewal-adult:dental-insurance.edit-access-to-dental-insurance')}
        </ButtonLink>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id="add-button-dental-insurance"
        variant="link"
        className="p-0"
        routeId="protected/application/$id/dental-insurance"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Add button dental insurance click"
      >
        {t('protected-application-renewal-adult:dental-insurance.add-answer')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the dental benefits card content based on whether the user has
 * entered new dental benefits, whether there are existing dental benefits on the client application, or if there
 * are no dental benefits at all. The logic is as follows:
 *
 * - If the user has entered new dental benefits (state.dentalBenefits is defined), show the new benefits.
 *
 * - If the user has not entered new dental benefits but there are existing dental benefits on the client
 *   application, show the existing benefits.
 *
 * - If there are no dental benefits on the client application and the user has not entered new dental benefits,
 *   show the help text.
 */
function DentalBenefitsCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  if (state.dentalBenefits?.hasChanged) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits')}>
            {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
              <div className="space-y-3">
                <p>{t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits-yes')}</p>
                <ul className="list-disc space-y-1 pl-7">
                  {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                  {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                </ul>
              </div>
            ) : (
              <p>{t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits-no')}</p>
            )}
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  if (clientApplication.dentalBenefits) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits')}>
            <div>
              {clientApplication.dentalBenefits.hasFederalBenefits || clientApplication.dentalBenefits.hasProvincialTerritorialBenefits ? (
                <div className="space-y-3">
                  <p>{t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits-yes')}</p>
                  <ul className="list-disc space-y-1 pl-7">
                    {clientApplication.dentalBenefits.hasFederalBenefits && <li>{clientApplication.dentalBenefits.federalSocialProgram}</li>}
                    {clientApplication.dentalBenefits.hasProvincialTerritorialBenefits && <li>{clientApplication.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                  </ul>
                </div>
              ) : (
                <p>{t('protected-application-renewal-adult:dental-insurance.access-to-government-benefits-no')}</p>
              )}
            </div>
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-renewal-adult:dental-insurance.dental-benefits-indicate-status')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the dental benefits card footer based on whether the user has
 * entered new dental benefits or if there are existing dental benefits on the client application. The logic is as follows:
 *
 * - If the user has entered new dental benefits (state.dentalBenefits is defined), show the "Edit" button.
 *
 * - If the user has not entered new dental benefits but there are existing dental benefits on the client
 *   application, show both the "Update" button and the "Not changed" button.
 *
 * - If there are no dental benefits on the client application and the user has not entered new dental benefits,
 *   show the "Add" button.
 */
function DentalBenefitsCardFooter(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication, sections } = useLoaderData<typeof loader>();
  const params = useParams();

  if (state.dentalBenefits || sections.dentalBenefits.completed) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id="edit-button-government-benefits"
          variant="link"
          className="p-0"
          routeId="protected/application/$id/federal-provincial-territorial-benefits"
          params={params}
          startIcon={faPenToSquare}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Edit button government benefits click"
        >
          {t('protected-application-renewal-adult:dental-insurance.edit-access-to-government-benefits')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.dentalBenefits) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-button-government-benefits"
            variant="link"
            className="p-0 pb-5"
            routeId="protected/application/$id/federal-provincial-territorial-benefits"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Update button government benefits click"
          >
            {t('protected-application-renewal-adult:dental-insurance.update-my-access')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-benefits-button"
            name="_action"
            value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED}
            variant="link"
            className="p-0 pt-5"
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Complete benefits click"
          >
            {t('protected-application-renewal-adult:dental-insurance.access-not-changed')}
          </Button>
        </div>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id="add-button-government-benefits"
        variant="link"
        className="p-0"
        routeId="protected/application/$id/federal-provincial-territorial-benefits"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Add button government benefits click"
      >
        {t('protected-application-renewal-adult:dental-insurance.add-access-to-government-benefits')}
      </ButtonLink>
    </CardFooter>
  );
}

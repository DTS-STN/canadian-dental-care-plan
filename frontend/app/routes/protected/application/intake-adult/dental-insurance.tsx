import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeAdultState } from '~/.server/routes/helpers/protected-application-intake-adult-route-helpers';
import { isDentalBenefitsSectionCompleted, isDentalInsuranceSectionCompleted } from '~/.server/routes/helpers/protected-application-intake-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/intake-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-intake-adult', 'gcweb'),
  pageIdentifier: pageIds.protected.application.intakeAdult.dentalInsurance,
  pageTitleI18nKey: 'protected-application-intake-adult:dentalInsurance.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-intake-adult:dentalInsurance.pageTitle') }) };

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.value?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.value?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  return {
    state: {
      dentalInsurance: state.dentalInsurance,
      dentalBenefits:
        state.dentalBenefits?.hasChanged === true
          ? {
              federalBenefit: {
                access: state.dentalBenefits.value.hasFederalBenefits,
                benefit: selectedFederalGovernmentInsurancePlan?.name,
              },
              provTerrBenefit: {
                access: state.dentalBenefits.value.hasProvincialTerritorialBenefits,
                benefit: selectedProvincialBenefit?.name,
              },
            }
          : undefined,
    },
    sections: {
      dentalInsurance: { completed: isDentalInsuranceSectionCompleted(state) },
      dentalBenefits: { completed: isDentalBenefitsSectionCompleted(state) },
    },
    meta,
  };
}

export default function NewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="dentalInsurance" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:completeAllSections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protected-application-intake-adult:dentalInsurance.accessToDentalInsurance')}</h2>
            </CardTitle>
            <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalInsurance?.dentalInsuranceEligibilityConfirmation === true ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-intake-adult:dentalInsurance.accessToDentalInsuranceOrCoverage')}>
                  {state.dentalInsurance.hasDentalInsurance ? t('protected-application-intake-adult:dentalInsurance.dentalInsuranceYes') : t('protected-application-intake-adult:dentalInsurance.dentalInsuranceNo')}
                </DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('protected-application-intake-adult:dentalInsurance.dentalInsuranceIndicateStatus')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-insurance-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/dental-insurance"
              params={params}
              startIcon={sections.dentalInsurance.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              aria-label={
                state.dentalInsurance === undefined
                  ? `${t('protected-application-intake-adult:dentalInsurance.addAnswer')} - ${t('protected-application-intake-adult:dentalInsurance.accessToDentalInsurance')}`
                  : t('protected-application-intake-adult:dentalInsurance.editAccessToDentalInsurance')
              }
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Edit insurance click"
            >
              {state.dentalInsurance === undefined ? t('protected-application-intake-adult:dentalInsurance.addAnswer') : t('protected-application-intake-adult:dentalInsurance.editAccessToDentalInsurance')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protected-application-intake-adult:dentalInsurance.otherBenefits')}</h2>
            </CardTitle>
            <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalBenefits ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-intake-adult:dentalInsurance.accessToGovernmentBenefits')}>
                  {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
                    <div className="space-y-3">
                      <p>{t('protected-application-intake-adult:dentalInsurance.accessToGovernmentBenefitsYes')}</p>
                      <ul className="list-disc space-y-1 pl-7">
                        {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                        {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                      </ul>
                    </div>
                  ) : (
                    <p>{t('protected-application-intake-adult:dentalInsurance.accessToGovernmentBenefitsNo')}</p>
                  )}
                </DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('protected-application-intake-adult:dentalInsurance.dentalBenefitsIndicateStatus')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-benefits-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/federal-provincial-territorial-benefits"
              params={params}
              startIcon={sections.dentalBenefits.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              aria-label={
                state.dentalBenefits === undefined
                  ? `${t('protected-application-intake-adult:dentalInsurance.addAnswer')} - ${t('protected-application-intake-adult:dentalInsurance.otherBenefits')}`
                  : t('protected-application-intake-adult:dentalInsurance.editAccessToGovernmentBenefits')
              }
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Edit benefits click"
            >
              {state.dentalBenefits === undefined ? t('protected-application-intake-adult:dentalInsurance.addAnswer') : t('protected-application-intake-adult:dentalInsurance.editAccessToGovernmentBenefits')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/intake-adult/submit"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Continue click"
          >
            {t('protected-application-intake-adult:dentalInsurance.submit')}
          </NavigationButtonLink>
          <NavigationButtonLink
            variant="secondary"
            direction="previous"
            routeId="protected/application/$id/intake-adult/contact-information"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Back click"
          >
            {t('protected-application-intake-adult:dentalInsurance.contactInformation')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

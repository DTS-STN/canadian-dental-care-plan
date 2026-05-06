import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullFamilyState } from '~/.server/routes/helpers/public-application-full-family-route-helpers';
import { isDentalBenefitsSectionCompleted, isDentalInsuranceSectionCompleted } from '~/.server/routes/helpers/public-application-full-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-family/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'applicationFullFamily', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullFamily.dentalInsurance,
  pageTitleI18nKey: 'applicationFullFamily:dentalInsurance.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['full-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.dentalInsurance.pageTitle, { ns: 'applicationFullFamily' }) }),
  };

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.value?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.value?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  return {
    state: {
      dentalInsurance: state.dentalInsurance?.hasDentalInsurance,
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

export default function NewFamilyDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="dentalInsurance" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t(($) => $.completeAllSections)}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.dentalInsurance.accessToDentalInsurance, { ns: 'applicationFullFamily' })}</h2>
            </CardTitle>
            <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalInsurance === undefined ? (
              <p>{t(($) => $.dentalInsurance.dentalInsuranceIndicateStatus, { ns: 'applicationFullFamily' })}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.dentalInsurance.accessToDentalInsuranceOrCoverage, { ns: 'applicationFullFamily' })}>
                  {state.dentalInsurance ? t(($) => $.dentalInsurance.dentalInsuranceYes, { ns: 'applicationFullFamily' }) : t(($) => $.dentalInsurance.dentalInsuranceNo, { ns: 'applicationFullFamily' })}
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-insurance-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/dental-insurance"
              params={params}
              startIcon={sections.dentalInsurance.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              aria-label={
                state.dentalInsurance === undefined
                  ? `${t(($) => $.dentalInsurance.addAnswer, { ns: 'applicationFullFamily' })} - ${t(($) => $.dentalInsurance.accessToDentalInsurance, { ns: 'applicationFullFamily' })}`
                  : t(($) => $.dentalInsurance.editAccessToDentalInsurance, { ns: 'applicationFullFamily' })
              }
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Family:Edit insurance click"
            >
              {state.dentalInsurance === undefined ? t(($) => $.dentalInsurance.addAnswer, { ns: 'applicationFullFamily' }) : t(($) => $.dentalInsurance.editAccessToDentalInsurance, { ns: 'applicationFullFamily' })}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.dentalInsurance.otherBenefits, { ns: 'applicationFullFamily' })}</h2>
            </CardTitle>
            <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalBenefits ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.dentalInsurance.accessToGovernmentBenefits, { ns: 'applicationFullFamily' })}>
                  {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
                    <div className="space-y-3">
                      <p>{t(($) => $.dentalInsurance.accessToGovernmentBenefitsYes, { ns: 'applicationFullFamily' })}</p>
                      <ul className="list-disc space-y-1 pl-7">
                        {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                        {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                      </ul>
                    </div>
                  ) : (
                    <p>{t(($) => $.dentalInsurance.accessToGovernmentBenefitsNo, { ns: 'applicationFullFamily' })}</p>
                  )}
                </DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t(($) => $.dentalInsurance.dentalBenefitsIndicateStatus, { ns: 'applicationFullFamily' })}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-benefits-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/federal-provincial-territorial-benefits"
              params={params}
              startIcon={sections.dentalBenefits.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              aria-label={
                state.dentalBenefits === undefined
                  ? `${t(($) => $.dentalInsurance.addAnswer, { ns: 'applicationFullFamily' })} - ${t(($) => $.dentalInsurance.otherBenefits, { ns: 'applicationFullFamily' })}`
                  : t(($) => $.dentalInsurance.editAccessToGovernmentBenefits, { ns: 'applicationFullFamily' })
              }
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Family:Edit benefits click"
            >
              {state.dentalBenefits === undefined ? t(($) => $.dentalInsurance.addAnswer, { ns: 'applicationFullFamily' }) : t(($) => $.dentalInsurance.editAccessToGovernmentBenefits, { ns: 'applicationFullFamily' })}
            </ButtonLink>
          </CardFooter>
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="public/application/$id/full-family/childrens-application"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Family:Continue click"
          >
            {t(($) => $.dentalInsurance.childrensApplication, { ns: 'applicationFullFamily' })}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/full-family/contact-information" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Family:Back click">
            {t(($) => $.dentalInsurance.contactInformation, { ns: 'applicationFullFamily' })}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

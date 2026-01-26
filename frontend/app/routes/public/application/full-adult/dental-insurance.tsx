import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullAdultState } from '~/.server/routes/helpers/public-application-full-adult-route-helpers';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { ProgressStepper } from '~/components/progress-stepper';
import { StatusTag } from '~/components/status-tag';
import { useProgressStepper } from '~/hooks/use-progress-stepper';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.dentalInsurance,
  pageTitleI18nKey: 'application-full-adult:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-adult:dental-insurance.page-title') }) };

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
    meta,
  };
}

export default function NewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('full-adult', 'dental-insurance');

  const sections = [
    { id: 'dental-insurance', completed: state.dentalInsurance?.dentalInsuranceEligibilityConfirmation === true }, //
    { id: 'dental-benefits', completed: state.dentalBenefits !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).map((section) => section.id);
  const allSectionsCompleted = completedSections.length === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper steps={steps} currentStep={currentStep} />
      <div className="space-y-4">
        <p>{t('application:required-label')}</p>
        <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('application-full-adult:dental-insurance.access-to-dental-insurance')}</CardTitle>
          <CardAction>{completedSections.includes('dental-insurance') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.dentalInsurance?.dentalInsuranceEligibilityConfirmation === true ? (
            <DefinitionList layout="single-column">
              <DefinitionListItem term={t('application-full-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
                {state.dentalInsurance.hasDentalInsurance ? t('application-full-adult:dental-insurance.dental-insurance-yes') : t('application-full-adult:dental-insurance.dental-insurance-no')}
              </DefinitionListItem>
            </DefinitionList>
          ) : (
            <p>{t('application-full-adult:dental-insurance.dental-insurance-indicate-status')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalInsurance === undefined ? t('application-full-adult:dental-insurance.add-answer') : t('application-full-adult:dental-insurance.edit-access-to-dental-insurance')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-full-adult:dental-insurance.other-benefits')}</CardTitle>
          <CardAction>{completedSections.includes('dental-benefits') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.dentalBenefits ? (
            <DefinitionList layout="single-column">
              <DefinitionListItem term={t('application-full-adult:dental-insurance.access-to-government-benefits')}>
                {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
                  <div className="space-y-3">
                    <p>{t('application-full-adult:dental-insurance.access-to-government-benefits-yes')}</p>
                    <ul className="list-disc space-y-1 pl-7">
                      {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                      {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                    </ul>
                  </div>
                ) : (
                  <p>{t('application-full-adult:dental-insurance.access-to-government-benefits-no')}</p>
                )}
              </DefinitionListItem>
            </DefinitionList>
          ) : (
            <p>{t('application-full-adult:dental-insurance.dental-benefits-indicate-status')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/federal-provincial-territorial-benefits" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalBenefits === undefined ? t('application-full-adult:dental-insurance.add-answer') : t('application-full-adult:dental-insurance.edit-access-to-government-benefits')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/full-adult/submit" params={params}>
          {t('application-full-adult:dental-insurance.submit')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/full-adult/marital-status" params={params}>
          {t('application-full-adult:dental-insurance.contact-information')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DescriptionListItem } from '~/components/description-list-item';
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-family', 'gcweb'),
  pageIdentifier: pageIds.public.application.newFamily.dentalInsurance,
  pageTitleI18nKey: 'application-new-family:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-family:dental-insurance.page-title') }) };

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const dentalBenefits = {
    federalBenefit: {
      access: state.dentalBenefits?.hasFederalBenefits,
      benefit: selectedFederalGovernmentInsurancePlan?.name,
    },
    provTerrBenefit: {
      access: state.dentalBenefits?.hasProvincialTerritorialBenefits,
      benefit: selectedProvincialBenefit?.name,
    },
  };

  return {
    state: {
      dentalInsurance: state.dentalInsurance?.hasDentalInsurance,
      hasFederalProvincialTerritorialBenefits: state.hasFederalProvincialTerritorialBenefits,
      dentalBenefits: state.dentalBenefits ? dentalBenefits : undefined,
    },
    meta,
  };
}

export default function NewFamilyDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-family', 'dental-insurance');

  const sections = [
    { id: 'dental-insurance', completed: state.dentalInsurance !== undefined }, //
    { id: 'dental-benefits', completed: state.hasFederalProvincialTerritorialBenefits !== undefined },
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
          <CardTitle>{t('application-new-family:dental-insurance.access-to-dental-insurance')}</CardTitle>
          <CardAction>{completedSections.includes('dental-insurance') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.dentalInsurance === undefined ? (
            <p>{t('application-new-family:dental-insurance.dental-insurance-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-family:dental-insurance.access-to-dental-insurance-or-coverage')}>
                <p>{state.dentalInsurance ? t('application-new-family:dental-insurance.dental-insurance-yes') : t('application-new-family:dental-insurance.dental-insurance-no')}</p>
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalInsurance === undefined ? t('application-new-family:dental-insurance.add-answer') : t('application-new-family:dental-insurance.edit-access-to-dental-insurance')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-family:dental-insurance.other-benefits')}</CardTitle>
          <CardAction>{completedSections.includes('dental-benefits') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.hasFederalProvincialTerritorialBenefits === undefined ? (
            <p>{t('application-new-family:dental-insurance.dental-benefits-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-family:dental-insurance.access-to-government-benefits')}>
                {state.hasFederalProvincialTerritorialBenefits === true ? (
                  <>
                    <p>{t('application-new-family:dental-insurance.dental-insurance-yes')}</p>
                    {state.dentalBenefits?.federalBenefit.access || state.dentalBenefits?.provTerrBenefit.access ? (
                      <>
                        <p>{t('application-new-family:dental-insurance.yes')}</p>
                        <ul className="ml-6 list-disc">
                          {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                          {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                        </ul>
                      </>
                    ) : (
                      <p>{t('application-new-family:dental-insurance.no')}</p>
                    )}
                  </>
                ) : (
                  <p>{t('application-new-family:dental-insurance.dental-insurance-no')}</p>
                )}
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/confirm-federal-provincial-territorial-benefits" params={params} startIcon={faCirclePlus} size="lg">
            {state.hasFederalProvincialTerritorialBenefits === undefined ? t('application-new-family:dental-insurance.add-answer') : t('application-new-family:dental-insurance.edit-access-to-government-benefits')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        {/* TODO update with correct route */}
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-family/dental-insurance" params={params}>
          {t('application-new-family:dental-insurance.childrens-application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/new-family/contact-information" params={params}>
          {t('application-new-family:dental-insurance.contact-information')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationAdultState } from '~/.server/routes/helpers/public-application-adult-route-helpers';
import { validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-renew-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewAdult.dentalInsurance,
  pageTitleI18nKey: 'application-renew-adult:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationAdultState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['renew-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-renew-adult:dental-insurance.page-title') }) };

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

export default function RenewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('renew-adult', 'dental-insurance');

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
          <CardTitle>{t('application-renew-adult:dental-insurance.access-to-dental-insurance')}</CardTitle>
          <CardAction>{completedSections.includes('dental-insurance') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.dentalInsurance === undefined ? (
            <p>{t('application-renew-adult:dental-insurance.dental-insurance-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-renew-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
                <p>{state.dentalInsurance ? t('application-renew-adult:dental-insurance.dental-insurance-yes') : t('application-renew-adult:dental-insurance.dental-insurance-no')}</p>
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalInsurance === undefined ? t('application-renew-adult:dental-insurance.add-answer') : t('application-renew-adult:dental-insurance.edit-access-to-dental-insurance')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-renew-adult:dental-insurance.other-benefits')}</CardTitle>
          <CardAction>{completedSections.includes('dental-benefits') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.hasFederalProvincialTerritorialBenefits === undefined ? (
            <p>{t('application-renew-adult:dental-insurance.dental-benefits-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-renew-adult:dental-insurance.access-to-government-benefits')}>
                {state.hasFederalProvincialTerritorialBenefits === true ? (
                  <>
                    <p>{t('application-renew-adult:dental-insurance.dental-insurance-yes')}</p>
                    {state.dentalBenefits?.federalBenefit.access || state.dentalBenefits?.provTerrBenefit.access ? (
                      <>
                        <p>{t('application-renew-adult:dental-insurance.yes')}</p>
                        <ul className="ml-6 list-disc">
                          {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                          {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                        </ul>
                      </>
                    ) : (
                      <p>{t('application-renew-adult:dental-insurance.no')}</p>
                    )}
                  </>
                ) : (
                  <p>{t('application-renew-adult:dental-insurance.dental-insurance-no')}</p>
                )}
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start border-t bg-zinc-100">
          {state.hasFederalProvincialTerritorialBenefits === undefined ? (
            <>
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/confirm-federal-provincial-territorial-benefits" params={params} startIcon={faPenToSquare} size="lg">
                {t('application-renew-adult:dental-insurance.update-my-access')}
              </ButtonLink>
              <br />
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/confirm-federal-provincial-territorial-benefits" params={params} startIcon={faCircleCheck} size="lg">
                {t('application-renew-adult:dental-insurance.access-not-changed')}
              </ButtonLink>
            </>
          ) : (
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/confirm-federal-provincial-territorial-benefits" params={params} startIcon={faCirclePlus} size="lg">
              {t('application-renew-adult:dental-insurance.edit-access-to-government-benefits')}
            </ButtonLink>
          )}
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/renew-adult/dental-insurance" params={params}>
          {t('application-renew-adult:dental-insurance.submit')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/renew-adult/dental-insurance" params={params}>
          {t('application-renew-adult:dental-insurance.contact-information')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

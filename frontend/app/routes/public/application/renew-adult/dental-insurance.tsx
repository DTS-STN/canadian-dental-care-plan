import { data, useFetcher } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicRenewAdultState } from '~/.server/routes/helpers/public-renew-adult-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
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

const FORM_ACTION = {
  DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-renew-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewAdult.dentalInsurance,
  pageTitleI18nKey: 'application-renew-adult:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicRenewAdultState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['renew-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-renew-adult:dental-insurance.page-title') }) };

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.value?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.value?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
    : undefined;

  return {
    state: {
      dentalInsurance: state.dentalInsurance?.hasDentalInsurance,
      dentalBenefits: state.dentalBenefits
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
        : undefined,
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicRenewAdultState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['renew-adult']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === (FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED as string)) {
    savePublicApplicationState({ params, session, state: { dentalBenefits: { hasChanged: false, value: undefined } } });
  }

  return data({ success: true }, { status: 200 });
}

export default function RenewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();

  const { steps, currentStep } = useProgressStepper('renew-adult', 'dental-insurance');

  const sections = [
    { id: 'dental-insurance', completed: state.dentalInsurance !== undefined }, //
    { id: 'dental-benefits', completed: state.dentalBenefits !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).map((section) => section.id);
  const allSectionsCompleted = completedSections.length === sections.length;

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
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
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-renew-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
                  <p>{state.dentalInsurance ? t('application-renew-adult:dental-insurance.dental-insurance-yes') : t('application-renew-adult:dental-insurance.dental-insurance-no')}</p>
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button-dental-insurance" variant="link" className="p-0" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
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
            {state.dentalBenefits ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-renew-adult:dental-insurance.access-to-government-benefits')}>
                  {state.dentalBenefits.hasChanged ? (
                    <>
                      {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
                        <div className="space-y-3">
                          <p>{t('application-renew-adult:dental-insurance.access-to-government-benefits-yes')}</p>
                          <ul className="list-disc space-y-1 pl-7">
                            {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                            {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                          </ul>
                        </div>
                      ) : (
                        <p>{t('application-renew-adult:dental-insurance.access-to-government-benefits-no')}</p>
                      )}
                    </>
                  ) : (
                    <p>{t('application-renew-adult:dental-insurance.no-change')}</p>
                  )}
                </DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('application-renew-adult:dental-insurance.dental-benefits-indicate-status')}</p>
            )}
          </CardContent>
          {state.dentalBenefits ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button-government-benefits" variant="link" className="p-0" routeId="public/application/$id/federal-provincial-territorial-benefits" params={params} startIcon={faCirclePlus} size="lg">
                {t('application-renew-adult:dental-insurance.edit-access-to-government-benefits')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="edit-button-update-access" variant="link" className="p-0 pb-5" routeId="public/application/$id/federal-provincial-territorial-benefits" params={params} startIcon={faPenToSquare} size="lg">
                  {t('application-renew-adult:dental-insurance.update-my-access')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="edit-button-not-changed" name="_action" value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED} variant="link" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('application-renew-adult:dental-insurance.access-not-changed')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/renew-adult/submit" params={params}>
            {t('application-renew-adult:dental-insurance.submit')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/renew-adult/contact-information" params={params}>
            {t('application-renew-adult:dental-insurance.contact-information')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

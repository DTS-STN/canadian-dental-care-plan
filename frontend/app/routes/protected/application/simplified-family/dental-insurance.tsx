import { data, useFetcher } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { loadProtectedApplicationSimplifiedFamilyState } from '~/.server/routes/helpers/protected-application-simplified-family-route-helpers';
import { isDentalBenefitsSectionCompleted, isDentalInsuranceSectionCompleted } from '~/.server/routes/helpers/protected-application-simplified-section-checks';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/simplified-family/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-simplified-family', 'gcweb'),
  pageIdentifier: pageIds.protected.application.simplifiedFamily.dentalInsurance,
  pageTitleI18nKey: 'protected-application-simplified-family:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-simplified-family:dental-insurance.page-title') }) };

  const selectedFederalGovernmentInsurancePlan = state.dentalBenefits?.value?.federalSocialProgram
    ? await appContainer.get(TYPES.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
    : undefined;

  const selectedProvincialBenefit = state.dentalBenefits?.value?.provincialTerritorialSocialProgram
    ? await appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
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
    sections,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === (FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED as string)) {
    saveProtectedApplicationState({ params, session, state: { dentalBenefits: { hasChanged: false, value: undefined } } });
  }

  return data({ success: true }, { status: 200 });
}

export default function ProtectedRenewFamilyDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="dental-insurance" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-simplified-family:dental-insurance.access-to-dental-insurance')}</CardTitle>
            <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalInsurance === undefined ? (
              <p>{t('protected-application-simplified-family:dental-insurance.dental-insurance-indicate-status')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-simplified-family:dental-insurance.access-to-dental-insurance-or-coverage')}>
                  <p>{state.dentalInsurance ? t('protected-application-simplified-family:dental-insurance.dental-insurance-yes') : t('protected-application-simplified-family:dental-insurance.dental-insurance-no')}</p>
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button-dental-insurance" variant="link" className="p-0" routeId="protected/application/$id/dental-insurance" params={params} startIcon={sections.dentalInsurance.completed ? faPenToSquare : faCirclePlus} size="lg">
              {state.dentalInsurance === undefined ? t('protected-application-simplified-family:dental-insurance.add-answer') : t('protected-application-simplified-family:dental-insurance.edit-access-to-dental-insurance')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-simplified-family:dental-insurance.other-benefits')}</CardTitle>
            <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.dentalBenefits ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-simplified-family:dental-insurance.access-to-government-benefits')}>
                  {state.dentalBenefits.hasChanged ? (
                    <>
                      {state.dentalBenefits.federalBenefit.access || state.dentalBenefits.provTerrBenefit.access ? (
                        <div className="space-y-3">
                          <p>{t('protected-application-simplified-family:dental-insurance.access-to-government-benefits-yes')}</p>
                          <ul className="list-disc space-y-1 pl-7">
                            {state.dentalBenefits.federalBenefit.access && <li>{state.dentalBenefits.federalBenefit.benefit}</li>}
                            {state.dentalBenefits.provTerrBenefit.access && <li>{state.dentalBenefits.provTerrBenefit.benefit}</li>}
                          </ul>
                        </div>
                      ) : (
                        <p>{t('protected-application-simplified-family:dental-insurance.access-to-government-benefits-no')}</p>
                      )}
                    </>
                  ) : (
                    <p>{t('protected-application-simplified-family:dental-insurance.no-change')}</p>
                  )}
                </DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('protected-application-simplified-family:dental-insurance.dental-benefits-indicate-status')}</p>
            )}
          </CardContent>
          {state.dentalBenefits ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink
                id="edit-button-government-benefits"
                variant="link"
                className="p-0"
                routeId="protected/application/$id/federal-provincial-territorial-benefits"
                params={params}
                startIcon={sections.dentalBenefits.completed ? faPenToSquare : faCirclePlus}
                size="lg"
              >
                {t('protected-application-simplified-family:dental-insurance.edit-access-to-government-benefits')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="edit-button-update-access" variant="link" className="p-0 pb-5" routeId="protected/application/$id/federal-provincial-territorial-benefits" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-simplified-family:dental-insurance.update-my-access')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="edit-button-not-changed" name="_action" value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED} variant="link" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-simplified-family:dental-insurance.access-not-changed')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="protected/application/$id/simplified-family/childrens-application" params={params}>
            {t('protected-application-simplified-family:dental-insurance.childrens-application')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/simplified-family/contact-information" params={params}>
            {t('protected-application-simplified-family:dental-insurance.contact-information')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

import { invariant } from '@dts-stn/invariant';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationFullChildState } from '~/.server/routes/helpers/protected-application-full-child-route-helpers';
import { isChildDentalBenefitsSectionCompleted, isChildDentalInsuranceSectionCompleted, isParentGuardianSectionCompleted, isSinSectionCompleted } from '~/.server/routes/helpers/protected-application-full-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/full-children/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-full-child', 'protected-application', 'gcweb', 'common'),
  pageIdentifier: pageIds.protected.application.fullChild.childApplication,
  pageTitleI18nKey: 'protected-application-full-child:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationFullChildState({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-full-child:childrens-application.page-title') }) };

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const children = await Promise.all(
    state.children.map(async (child) => {
      const federalGovernmentInsurancePlanProgram = child.dentalBenefits?.value?.federalSocialProgram
        ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.value.federalSocialProgram, locale)
        : undefined;

      const provincialTerritorialSocialProgram = child.dentalBenefits?.value?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
        : undefined;

      return {
        ...child,
        dentalBenefits:
          child.dentalBenefits?.hasChanged === true
            ? {
                federalBenefit: {
                  access: child.dentalBenefits.value.hasFederalBenefits,
                  benefit: federalGovernmentInsurancePlanProgram?.name,
                },
                provTerrBenefit: {
                  access: child.dentalBenefits.value.hasProvincialTerritorialBenefits,
                  benefit: provincialTerritorialSocialProgram?.name,
                },
              }
            : undefined,
      };
    }),
  );

  return {
    state: {
      children: children,
    },
    meta,
    childrenSections: state.children.map((child) => ({
      id: child.id,
      sections: {
        sin: {
          completed: isSinSectionCompleted(child),
        },
        parentGuardian: {
          completed: isParentGuardianSectionCompleted(child),
        },
        childDentalInsurance: {
          completed: isChildDentalInsuranceSectionCompleted(child),
        },
        childDentalBenefits: {
          completed: isChildDentalBenefitsSectionCompleted(child),
        },
      },
    })),
  };
}

export default function ProtectedNewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { state, childrenSections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const allChildrenCompleted = state.children.length > 0 && childrenSections.every((child) => Object.values(child.sections).every((section) => section.completed));

  return (
    <>
      <ProgressStepper activeStep="childrens-application" className="mb-8" />
      <div className="max-w-prose space-y-8">
        {state.children.map((child, index) => {
          const sections = childrenSections.find((c) => c.id === child.id)?.sections;
          invariant(sections, 'Expected sections to be defined for child');
          const sectionCompletedCount = Object.values(sections).filter((section) => section.completed).length;
          const sectionsCount = Object.values(sections).length;

          return (
            <div key={child.id}>
              <h2 className="font-lato mb-4 text-2xl font-bold">{t('protected-application-full-child:childrens-application.child-title', { childNumber: index + 1 })}</h2>
              <div className="space-y-4">
                <p>{t('protected-application:complete-all-sections')}</p>
                <p>{t('common:sections-completed', { number: sectionCompletedCount, count: sectionsCount })}</p>
              </div>
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-full-child:childrens-application.child-sin-card-title')}</CardTitle>
                  <CardAction>{sections.sin.completed ? <StatusTag status="complete" /> : <StatusTag status="optional" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.information === undefined ? (
                    <p>{t('protected-application-full-child:childrens-application.child-sin-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-full-child:childrens-application.sin-title')}>
                        <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/social-insurance-number"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.sin.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.information === undefined ? t('protected-application-full-child:childrens-application.add-child-sin') : t('protected-application-full-child:childrens-application.edit-child-sin')}
                  </ButtonLink>
                </CardFooter>
              </Card>
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-full-child:childrens-application.child-parent-guardian-card-title')}</CardTitle>
                  <CardAction>{sections.parentGuardian.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.information === undefined ? (
                    <p>{t('protected-application-full-child:childrens-application.child-parent-guardian-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-full-child:childrens-application.parent-guardian-title')}>
                        <p>{child.information.isParent ? t('protected-application-full-child:childrens-application.yes') : t('protected-application-full-child:childrens-application.no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/parent-guardian"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.parentGuardian.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.information === undefined ? t('protected-application-full-child:childrens-application.add-answer') : t('protected-application-full-child:childrens-application.edit-answer')}
                  </ButtonLink>
                </CardFooter>
              </Card>
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-full-child:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                  <CardAction>{sections.childDentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalInsurance === undefined ? (
                    <p>{t('protected-application-full-child:childrens-application.child-dental-insurance-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-full-child:childrens-application.dental-insurance-title')}>
                        <p>{child.dentalInsurance.hasDentalInsurance ? t('protected-application-full-child:childrens-application.dental-insurance-yes') : t('protected-application-full-child:childrens-application.dental-insurance-no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/dental-insurance"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childDentalInsurance.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.dentalInsurance === undefined ? t('protected-application-full-child:childrens-application.add-answer') : t('protected-application-full-child:childrens-application.edit-child-dental-insurance', { childNumber: index + 1 })}
                  </ButtonLink>
                </CardFooter>
              </Card>

              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-full-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                  <CardAction>{sections.childDentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalBenefits === undefined ? (
                    <p>{t('protected-application-full-child:childrens-application.child-dental-benefits-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-full-child:childrens-application.dental-benefits-title')}>
                        {child.dentalBenefits.federalBenefit.access || child.dentalBenefits.provTerrBenefit.access ? (
                          <div className="space-y-3">
                            <p>{t('protected-application-full-child:childrens-application.dental-benefits-yes')}</p>
                            <ul className="list-disc space-y-1 pl-7">
                              {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                              {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                            </ul>
                          </div>
                        ) : (
                          <p>{t('protected-application-full-child:childrens-application.dental-benefits-no')}</p>
                        )}
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/federal-provincial-territorial-benefits"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childDentalBenefits.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.dentalBenefits === undefined ? t('protected-application-full-child:childrens-application.add-answer') : t('protected-application-full-child:childrens-application.edit-child-dental-benefits')}
                  </ButtonLink>
                </CardFooter>
              </Card>
            </div>
          );
        })}

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allChildrenCompleted} variant="primary" direction="next" routeId="protected/application/$id/full-children/submit" params={params}>
            {t('protected-application-full-child:childrens-application.submit-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/full-children/parent-or-guardian" params={params}>
            {t('protected-application-full-child:childrens-application.back-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

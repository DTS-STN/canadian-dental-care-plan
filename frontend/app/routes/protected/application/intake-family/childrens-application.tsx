import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeFamilyState } from '~/.server/routes/helpers/protected-application-intake-family-route-helpers';
import { isChildDentalBenefitsSectionCompleted, isChildDentalInsuranceSectionCompleted, isChildInformationSectionCompleted } from '~/.server/routes/helpers/protected-application-intake-section-checks';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useCurrentLanguage, useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/intake-family/progress-stepper';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { generateId } from '~/utils/id.utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = { add: 'add', remove: 'remove' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-intake-family', 'protected-application', 'gcweb', 'common'),
  pageIdentifier: pageIds.protected.application.intakeFamily.childApplication,
  pageTitleI18nKey: 'protected-application-intake-family:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-intake-family:childrens-application.page-title') }) };

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
    childrenSections: state.children.map((child) => ({
      id: child.id,
      sections: {
        childInformation: { completed: isChildInformationSectionCompleted(child) },
        childDentalInsurance: { completed: isChildDentalInsuranceSectionCompleted(child) },
        childDentalBenefits: { completed: isChildDentalBenefitsSectionCompleted(child) },
      },
    })),
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-family']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.add) {
    const childId = generateId();
    const children = [...state.children, { id: childId }];

    saveProtectedApplicationState({
      params,
      session,
      state: {
        children: children,
      },
    });
  }

  if (formAction === FORM_ACTION.remove) {
    const removeChildId = formData.get('childId');
    const children = [...state.children].filter((child) => child.id !== removeChildId);

    saveProtectedApplicationState({
      params,
      session,
      state: {
        children: children,
      },
    });
  }

  return redirect(getPathById(`protected/application/$id/${state.context}-${state.typeOfApplication}/childrens-application`, params));
}

export default function ProtectedNewFamilyChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { state, childrenSections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const allChildrenCompleted = state.children.length > 0 && childrenSections.every((child) => Object.values(child.sections).every((section) => section.completed));

  return (
    <>
      <ProgressStepper activeStep="childrens-application" className="mb-8" />
      <div className="max-w-prose space-y-8">
        {state.children.map((child, index) => {
          const childName = `${child.information?.firstName} ${child.information?.lastName}`;
          const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';

          const sections = childrenSections.find((c) => c.id === child.id)?.sections;
          invariant(sections, 'Expected sections to be defined for child');
          const sectionCompletedCount = Object.values(sections).filter((section) => section.completed).length;
          const sectionsCount = Object.values(sections).length;

          return (
            <div key={child.id}>
              <h2 className="font-lato mb-4 text-2xl font-bold">{t('protected-application-intake-family:childrens-application.child-title', { childNumber: index + 1 })}</h2>
              <div className="space-y-4">
                <p>{t('protected-application:complete-all-sections')}</p>
                <p>{t('common:sections-completed', { number: sectionCompletedCount, count: sectionsCount })}</p>
              </div>
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-intake-family:childrens-application.child-information-card-title', { childNumber: index + 1 })}</CardTitle>
                  <CardAction>{sections.childInformation.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.information === undefined ? (
                    <p>{t('protected-application-intake-family:childrens-application.child-information-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      {child.information.memberId && (
                        <DefinitionListItem term={t('protected-application-intake-family:childrens-application.member-id-title')}>
                          <p>{child.information.memberId}</p>
                        </DefinitionListItem>
                      )}
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.full-name-title')}>
                        <p>{childName}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.dob-title')}>
                        <p>{dateOfBirth}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.sin-title')}>
                        <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.parent-guardian-title')}>
                        <p>{child.information.isParent ? t('protected-application-intake-family:childrens-application.yes') : t('protected-application-intake-family:childrens-application.no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-info-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/information"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childInformation.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.information === undefined ? t('protected-application-intake-family:childrens-application.add-child-information') : t('protected-application-intake-family:childrens-application.edit-child-information', { childNumber: index + 1 })}
                  </ButtonLink>
                </CardFooter>
              </Card>

              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-intake-family:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                  <CardAction>{sections.childDentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalInsurance === undefined ? (
                    <p>{t('protected-application-intake-family:childrens-application.child-dental-insurance-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.dental-insurance-title')}>
                        <p>{child.dentalInsurance.hasDentalInsurance ? t('protected-application-intake-family:childrens-application.dental-insurance-yes') : t('protected-application-intake-family:childrens-application.dental-insurance-no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-insurance-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/dental-insurance"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childDentalInsurance.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.dentalInsurance === undefined ? t('protected-application-intake-family:childrens-application.add-child-dental-insurance') : t('protected-application-intake-family:childrens-application.edit-child-dental-insurance')}
                  </ButtonLink>
                </CardFooter>
              </Card>

              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('protected-application-intake-family:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                  <CardAction>{sections.childDentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalBenefits === undefined ? (
                    <p>{t('protected-application-intake-family:childrens-application.child-dental-benefits-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('protected-application-intake-family:childrens-application.dental-benefits-title')}>
                        {child.dentalBenefits.federalBenefit.access || child.dentalBenefits.provTerrBenefit.access ? (
                          <div className="space-y-3">
                            <p>{t('protected-application-intake-family:childrens-application.dental-benefits-yes')}</p>
                            <ul className="list-disc space-y-1 pl-7">
                              {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                              {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                            </ul>
                          </div>
                        ) : (
                          <p>{t('protected-application-intake-family:childrens-application.dental-benefits-no')}</p>
                        )}
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id="edit-benefits-button"
                    variant="link"
                    className="p-0"
                    routeId="protected/application/$id/children/$childId/federal-provincial-territorial-benefits"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childDentalBenefits.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                  >
                    {child.dentalBenefits === undefined ? t('protected-application-intake-family:childrens-application.add-child-dental-benefits') : t('protected-application-intake-family:childrens-application.edit-child-dental-benefits')}
                  </ButtonLink>
                </CardFooter>
              </Card>
              <fetcher.Form method="post" noValidate>
                <CsrfTokenInput />
                <input type="hidden" name="childId" value={child.id} />
                <Button
                  id="remove-child"
                  className="my-5"
                  name="_action"
                  value={FORM_ACTION.remove}
                  disabled={isSubmitting}
                  variant="secondary"
                  size="sm"
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Remove child - Child(ren) application click"
                >
                  {t('protected-application-intake-family:childrens-application.remove-child')}
                </Button>
              </fetcher.Form>
            </div>
          );
        })}
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <Button variant="primary" id="add-child" name="_action" value={FORM_ACTION.add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Family:Add child - Child(ren) application click">
            {t('protected-application-intake-family:childrens-application.add-child')}
          </Button>
        </fetcher.Form>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allChildrenCompleted} variant="primary" direction="next" routeId="protected/application/$id/intake-family/submit" params={params}>
            {t('protected-application-intake-family:childrens-application.submit-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/intake-family/dental-insurance" params={params}>
            {t('protected-application-intake-family:childrens-application.back-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

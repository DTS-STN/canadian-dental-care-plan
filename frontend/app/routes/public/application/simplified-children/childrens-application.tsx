import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicApplicationSimplifiedChildState } from '~/.server/routes/helpers/public-application-simplified-child-route-helpers';
import { isChildDentalBenefitsSectionCompleted, isChildDentalInsuranceSectionCompleted, isChildInformationSectionCompleted } from '~/.server/routes/helpers/public-application-simplified-section-checks';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useCurrentLanguage, useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/simplified-children/progress-stepper';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { generateId } from '~/utils/id.utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = { add: 'add', remove: 'remove', DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-simplified-child', 'application', 'gcweb', 'common'),
  pageIdentifier: pageIds.public.application.simplifiedChild.childApplication,
  pageTitleI18nKey: 'application-simplified-child:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationSimplifiedChildState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-simplified-child:childrens-application.page-title') }) };

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
        dentalBenefits: child.dentalBenefits
          ? {
              hasChanged: child.dentalBenefits.hasChanged,
              federalBenefit: {
                access: child.dentalBenefits.value?.hasFederalBenefits,
                benefit: federalGovernmentInsurancePlanProgram?.name,
              },
              provTerrBenefit: {
                access: child.dentalBenefits.value?.hasProvincialTerritorialBenefits,
                benefit: provincialTerritorialSocialProgram?.name,
              },
            }
          : undefined,
      };
    }),
  );

  return {
    state: {
      children,
    },
    meta,
    // convert it into map with child id as key for easier access in the component
    childrenSections: Object.fromEntries(
      state.children.map((child) => [
        child.id,
        {
          childInformation: {
            completed: isChildInformationSectionCompleted(child),
          },
          dentalInsurance: {
            completed: isChildDentalInsuranceSectionCompleted(child),
          },
          dentalBenefits: {
            completed: isChildDentalBenefitsSectionCompleted(child),
          },
        },
      ]),
    ),
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicApplicationSimplifiedChildState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.add) {
    const childId = generateId();
    const children = [...state.children, { id: childId }];

    savePublicApplicationState({
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

    savePublicApplicationState({
      params,
      session,
      state: {
        children: children,
      },
    });
  }

  if (formAction === FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED) {
    const childId = formData.get('childId');
    savePublicApplicationState({
      params,
      session,
      state: {
        children: state.children.map((child) => {
          if (child.id !== childId) return child;
          return {
            ...child,
            dentalBenefits: { hasChanged: false },
          };
        }),
      },
    });

    return data({ success: true }, { status: 200 });
  }

  return redirect(getPathById(`public/application/$id/${state.inputModel}-${state.typeOfApplication}/childrens-application`, params));
}

export default function RenewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { state, childrenSections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const allChildrenCompleted = Object.keys(childrenSections).length > 0 && Object.values(childrenSections).every((sections) => Object.values(sections).every((section) => section.completed));

  return (
    <>
      <ProgressStepper activeStep="childrens-application" className="mb-8" />
      <div className="max-w-prose space-y-8">
        {state.children.map((child, index) => {
          const childName = `${child.information?.firstName} ${child.information?.lastName}`;
          const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';

          const sections = childrenSections[child.id];
          invariant(sections, `Expected child sections to be defined for child ${child.id}`);
          const completedSectionsCount = Object.values(sections).filter((section) => section.completed).length;

          return (
            <div key={child.id}>
              <h2 className="font-lato mb-4 text-2xl font-bold">{t('application-simplified-child:childrens-application.child-title', { childNumber: index + 1 })}</h2>
              <div className="space-y-4">
                <p>{t('application:complete-all-sections')}</p>
                <p>{t('common:sections-completed', { number: completedSectionsCount, count: Object.keys(sections).length })}</p>
              </div>
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('application-simplified-child:childrens-application.child-information-card-title', { childNumber: index + 1 })}</CardTitle>
                  <CardAction>{sections.childInformation.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.information === undefined ? (
                    <p>{t('application-simplified-child:childrens-application.child-information-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.member-id-title')}>
                        <p>{child.information.memberId}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.full-name-title')}>
                        <p>{childName}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.dob-title')}>
                        <p>{dateOfBirth}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.sin-title')}>
                        <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                      </DefinitionListItem>
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.parent-guardian-title')}>
                        <p>{child.information.isParent ? t('application-simplified-child:childrens-application.yes') : t('application-simplified-child:childrens-application.no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id={`edit-info-button-${child.id}`}
                    variant="link"
                    className="p-0"
                    routeId="public/application/$id/children/$childId/information"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.childInformation.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Action click"
                  >
                    {child.information === undefined ? t('application-simplified-child:childrens-application.add-child-information') : t('application-simplified-child:childrens-application.edit-child-information', { childNumber: index + 1 })}
                  </ButtonLink>
                </CardFooter>
              </Card>

              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('application-simplified-child:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                  <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalInsurance === undefined ? (
                    <p>{t('application-simplified-child:childrens-application.child-dental-insurance-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.dental-insurance-title')}>
                        <p>{child.dentalInsurance.hasDentalInsurance ? t('application-simplified-child:childrens-application.dental-insurance-yes') : t('application-simplified-child:childrens-application.dental-insurance-no')}</p>
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-zinc-100">
                  <ButtonLink
                    id={`edit-insurance-button-${child.id}`}
                    variant="link"
                    className="p-0"
                    routeId="public/application/$id/children/$childId/dental-insurance"
                    params={{ ...params, childId: child.id }}
                    startIcon={sections.dentalInsurance.completed ? faPenToSquare : faCirclePlus}
                    size="lg"
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Action click"
                  >
                    {child.dentalInsurance === undefined ? t('application-simplified-child:childrens-application.add-answer') : t('application-simplified-child:childrens-application.edit-child-dental-insurance')}
                  </ButtonLink>
                </CardFooter>
              </Card>

              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('application-simplified-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                  <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalBenefits === undefined ? (
                    <p>{t('application-simplified-child:childrens-application.child-dental-benefits-indicate-status')}</p>
                  ) : (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('application-simplified-child:childrens-application.dental-benefits-title')}>
                        {child.dentalBenefits.hasChanged ? (
                          <>
                            {child.dentalBenefits.federalBenefit.access || child.dentalBenefits.provTerrBenefit.access ? (
                              <div className="space-y-3">
                                <p>{t('application-simplified-child:childrens-application.dental-benefits-yes')}</p>
                                <ul className="list-disc space-y-1 pl-7">
                                  {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                                  {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                                </ul>
                              </div>
                            ) : (
                              <p>{t('application-simplified-child:childrens-application.dental-benefits-no')}</p>
                            )}
                          </>
                        ) : (
                          <p>{t('application-simplified-child:childrens-application.no-change')}</p>
                        )}
                      </DefinitionListItem>
                    </DefinitionList>
                  )}
                </CardContent>
                {child.dentalBenefits ? (
                  <CardFooter className="border-t bg-zinc-100">
                    <ButtonLink
                      id={`edit-benefits-button-${child.id}`}
                      variant="link"
                      className="p-0"
                      routeId="public/application/$id/children/$childId/federal-provincial-territorial-benefits"
                      params={{ ...params, childId: child.id }}
                      startIcon={sections.dentalBenefits.completed ? faPenToSquare : faCirclePlus}
                      size="lg"
                      data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Action click"
                    >
                      {t('application-simplified-child:childrens-application.edit-child-dental-benefits')}
                    </ButtonLink>
                  </CardFooter>
                ) : (
                  <CardFooter className="divide-y border-t bg-zinc-100 px-0">
                    <div className="w-full px-6">
                      <ButtonLink
                        id={`edit-button-update-access-${child.id}`}
                        variant="link"
                        className="p-0 pb-5"
                        routeId="public/application/$id/children/$childId/federal-provincial-territorial-benefits"
                        params={{ ...params, childId: child.id }}
                        startIcon={faPenToSquare}
                        size="lg"
                        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Edit button update access click"
                      >
                        {t('application-simplified-child:childrens-application.update-dental-benefits')}
                      </ButtonLink>
                    </div>
                    <fetcher.Form method="post" noValidate>
                      <CsrfTokenInput />
                      <input type="hidden" name="childId" value={child.id} />
                      <div className="w-full px-6">
                        <Button
                          id={`edit-button-not-changed-${child.id}`}
                          name="_action"
                          value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED}
                          disabled={isSubmitting}
                          variant="link"
                          className="p-0 pt-5"
                          startIcon={faCircleCheck}
                          size="lg"
                          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Edit button not changed click"
                        >
                          {t('application-simplified-child:childrens-application.benefits-not-changed')}
                        </Button>
                      </div>
                    </fetcher.Form>
                  </CardFooter>
                )}
              </Card>
              <fetcher.Form method="post" noValidate>
                <CsrfTokenInput />
                <input type="hidden" name="childId" value={child.id} />
                <Button
                  id={`remove-child-${child.id}`}
                  className="my-5"
                  name="_action"
                  value={FORM_ACTION.remove}
                  disabled={isSubmitting}
                  variant="secondary"
                  size="sm"
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form-Child:Remove child - Child(ren) application click"
                >
                  {t('application-simplified-child:childrens-application.remove-child')}
                </Button>
              </fetcher.Form>
            </div>
          );
        })}
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <Button variant="primary" id="add-child" name="_action" value={FORM_ACTION.add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form-Child:Add child - Child(ren) application click">
            {t('application-simplified-child:childrens-application.add-child')}
          </Button>
        </fetcher.Form>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allChildrenCompleted}
            variant="primary"
            direction="next"
            routeId="public/application/$id/simplified-children/submit"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Continue click"
          >
            {t('application-simplified-child:childrens-application.submit-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink
            variant="secondary"
            direction="previous"
            routeId="public/application/$id/simplified-children/parent-or-guardian"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Child:Back click"
          >
            {t('application-simplified-child:childrens-application.back-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

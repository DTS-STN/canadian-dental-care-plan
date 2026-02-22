import type { JSX, SyntheticEvent } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { loadProtectedApplicationSimplifiedChildState } from '~/.server/routes/helpers/protected-application-simplified-child-route-helpers';
import { isChildDentalBenefitsSectionCompleted, isChildDentalInsuranceSectionCompleted, isChildInformationSectionCompleted } from '~/.server/routes/helpers/protected-application-simplified-section-checks';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/simplified-children/progress-stepper';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

type ClientDentalBenefits = {
  federalBenefit?: {
    access: boolean;
    benefit: string;
  };
  provTerrBenefit?: {
    access: boolean;
    benefit: string;
  };
};

const FORM_ACTION = { DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-simplified-child', 'protected-application', 'gcweb', 'common'),
  pageIdentifier: pageIds.protected.application.simplifiedChild.childApplication,
  pageTitleI18nKey: 'protected-application-simplified-child:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedChildState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-simplified-child:childrens-application.page-title') }) };

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

      const immutableChild = state.clientApplication.children.find((c) => c.information.socialInsuranceNumber === child.information?.socialInsuranceNumber);
      const clientDentalBenefits = (await immutableChild?.dentalBenefits.reduce(async (benefitsPromise, id) => {
        const benefits = await benefitsPromise;

        const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(id, locale);
        if (federalProgram.isSome()) {
          return {
            ...benefits,
            federalBenefit: {
              access: true,
              benefit: federalProgram.unwrap().name,
            },
          };
        }

        const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(id, locale);
        if (provincialProgram.isSome()) {
          return {
            ...benefits,
            provTerrBenefit: {
              access: true,
              benefit: provincialProgram.unwrap().name,
            },
          };
        }

        return benefits;
      }, Promise.resolve({}))) as ClientDentalBenefits;

      return {
        ...child,
        clientDentalBenefits: clientDentalBenefits.federalBenefit?.access || clientDentalBenefits.provTerrBenefit?.access ? clientDentalBenefits : undefined,
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
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedChildState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-children']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === (FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED as string)) {
    const childId = formData.get('childId');
    saveProtectedApplicationState({
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

  return redirect(getPathById(`protected/application/$id/${state.inputModel}-${state.typeOfApplication}/childrens-application`, params));
}

export default function ProtectedRenewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { state, childrenSections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const allChildrenCompleted = Object.keys(childrenSections).length > 0 && Object.values(childrenSections).every((sections) => Object.values(sections).every((section) => section.completed));

  return (
    <>
      <ProgressStepper activeStep="childrens-application" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{t('protected-application:confirm-information')}</p>
        </div>

        {state.children.map((child, index) => {
          const sections = childrenSections[child.id];
          invariant(sections, `Expected child sections to be defined for child ${child.id}`);
          const completedSectionsCount = Object.values(sections).filter((section) => section.completed).length;

          return (
            <div key={child.id}>
              <h2 className="font-lato mb-4 text-2xl font-bold">{t('protected-application-simplified-child:childrens-application.child-title', { childNumber: index + 1 })}</h2>
              <p>{t('common:sections-completed', { number: completedSectionsCount, count: Object.keys(sections).length })}</p>

              <Card className="my-4">
                <CardHeader>
                  <CardTitle>{t('protected-application-simplified-child:childrens-application.child-information-card-title', { childNumber: index + 1 })}</CardTitle>
                  <CardAction>{sections.childInformation.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <ChildInformationCardContent child={child} />
                <ChildInformationCardFooter childId={child.id} childInformation={child.information} sectionCompleted={sections.childInformation.completed} params={params} index={index} />
              </Card>

              <Card className="my-4">
                <CardHeader>
                  <CardTitle>{t('protected-application-simplified-child:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                  <CardAction>{sections.dentalInsurance.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <ChildDentalInsuranceCardContent child={child} />
                <ChildDentalInsuranceCardFooter childId={child.id} dentalInsurance={child.dentalInsurance} sectionCompleted={sections.dentalInsurance.completed} params={params} />
              </Card>

              <Card className="my-4">
                <CardHeader>
                  <CardTitle>{t('protected-application-simplified-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                  <CardAction>{sections.dentalBenefits.completed && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <ChildDentalBenefitsCardContent child={child} />
                <ChildDentalBenefitsCardFooter child={child} sectionCompleted={sections.dentalBenefits.completed} params={params} />
              </Card>
            </div>
          );
        })}

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allChildrenCompleted} variant="primary" direction="next" routeId="protected/application/$id/simplified-children/submit" params={params}>
            {t('protected-application-simplified-child:childrens-application.submit-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/simplified-children/parent-or-guardian" params={params}>
            {t('protected-application-simplified-child:childrens-application.back-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

/**
 * This component determines what to show in the child information card content based on whether the user has
 * entered child information. The logic is as follows:
 *
 * - If the user has entered child information (child.information is defined), show the child's details.
 *
 * - If the user has not entered child information, show the help text to indicate they need to provide it.
 */
function ChildInformationCardContent({ child }: { child: Route.ComponentProps['loaderData']['state']['children'][0] }): JSX.Element {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);

  if (child.information) {
    const childName = `${child.information.firstName} ${child.information.lastName}`;
    const dateOfBirth = child.information.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';

    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.member-id-title')}>
            <p>{child.information.memberId}</p>
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.full-name-title')}>
            <p>{childName}</p>
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.dob-title')}>
            <p>{dateOfBirth}</p>
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.sin-title')}>
            <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.parent-guardian-title')}>
            <p>{child.information.isParent ? t('protected-application-simplified-child:childrens-application.yes') : t('protected-application-simplified-child:childrens-application.no')}</p>
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-simplified-child:childrens-application.child-information-indicate-status')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the child information card footer. The logic is as follows:
 *
 * - If the user has entered child information OR the section is completed, show the "Edit" button.
 *
 * - If the user has not entered child information, show the "Add" button.
 *
 * Note: There is no existing client application data for children, so we only have two states.
 */
function ChildInformationCardFooter({
  childId,
  childInformation,
  sectionCompleted,
  params,
  index,
}: {
  childId: string;
  childInformation: Route.ComponentProps['loaderData']['state']['children'][0]['information'];
  sectionCompleted: boolean;
  params: Route.ComponentProps['params'];
  index: number;
}): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);

  if (childInformation || sectionCompleted) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink id={`edit-child-info-${childId}`} variant="link" className="p-0" routeId="protected/application/$id/children/$childId/information" params={{ ...params, childId }} startIcon={faPenToSquare} size="lg">
          {t('protected-application-simplified-child:childrens-application.edit-child-information', { childNumber: index + 1 })}
        </ButtonLink>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink id={`add-child-info-${childId}`} variant="link" className="p-0" routeId="protected/application/$id/children/$childId/information" params={{ ...params, childId }} startIcon={faCirclePlus} size="lg">
        {t('protected-application-simplified-child:childrens-application.add-child-information')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the child dental insurance card content. The logic is as follows:
 *
 * - If the user has entered dental insurance information (child.dentalInsurance is defined), show the value.
 *
 * - If the user has not entered dental insurance information, show the help text.
 */
function ChildDentalInsuranceCardContent({ child }: { child: Route.ComponentProps['loaderData']['state']['children'][0] }): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);

  if (child.dentalInsurance !== undefined) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.dental-insurance-title')}>
            <p>{child.dentalInsurance.hasDentalInsurance ? t('protected-application-simplified-child:childrens-application.dental-insurance-yes') : t('protected-application-simplified-child:childrens-application.dental-insurance-no')}</p>
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-simplified-child:childrens-application.child-dental-insurance-indicate-status')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the child dental insurance card footer. The logic is as follows:
 *
 * - If the user has entered dental insurance information OR the section is completed, show the "Edit" button.
 *
 * - If the user has not entered dental insurance information, show the "Add" button.
 */
function ChildDentalInsuranceCardFooter({
  childId,
  dentalInsurance,
  sectionCompleted,
  params,
}: {
  childId: string;
  dentalInsurance: Route.ComponentProps['loaderData']['state']['children'][0]['dentalInsurance'];
  sectionCompleted: boolean;
  params: Route.ComponentProps['params'];
}): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);

  if (dentalInsurance !== undefined || sectionCompleted) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink id={`edit-child-dental-insurance-${childId}`} variant="link" className="p-0" routeId="protected/application/$id/children/$childId/dental-insurance" params={{ ...params, childId }} startIcon={faPenToSquare} size="lg">
          {t('protected-application-simplified-child:childrens-application.edit-child-dental-insurance')}
        </ButtonLink>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink id={`add-child-dental-insurance-${childId}`} variant="link" className="p-0" routeId="protected/application/$id/children/$childId/dental-insurance" params={{ ...params, childId }} startIcon={faCirclePlus} size="lg">
        {t('protected-application-simplified-child:childrens-application.add-answer')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the child dental benefits card content. The logic is as follows:
 *
 * - If the user has entered new dental benefits (child.dentalBenefits is defined with hasChanged=true), show the new benefits.
 *
 * - If the user has confirmed existing benefits haven't changed (child.dentalBenefits is defined with hasChanged=false),
 *   show a "no change" message.
 *
 * - If there are existing benefits from the client application (child.clientDentalBenefits is defined) and the user hasn't
 *   made changes, show the existing benefits.
 *
 * - If there are no dental benefits at all, show the help text.
 */
function ChildDentalBenefitsCardContent({ child }: { child: Route.ComponentProps['loaderData']['state']['children'][0] }): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);

  // Case 1: User has made changes (hasChanged true) - show their selections
  if (child.dentalBenefits?.hasChanged) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.dental-benefits-title')}>
            {child.dentalBenefits.federalBenefit.access || child.dentalBenefits.provTerrBenefit.access ? (
              <div className="space-y-3">
                <p>{t('protected-application-simplified-child:childrens-application.dental-benefits-yes')}</p>
                <ul className="list-disc space-y-1 pl-7">
                  {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                  {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                </ul>
              </div>
            ) : (
              <p>{t('protected-application-simplified-child:childrens-application.dental-benefits-no')}</p>
            )}
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  // Case 2: User has confirmed no changes (hasChanged false) - show no change message
  if (child.dentalBenefits && !child.dentalBenefits.hasChanged) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.dental-benefits-title')}>
            <p>{t('protected-application-simplified-child:childrens-application.no-change')}</p>
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  // Case 3: No user changes, but client has existing benefits - show existing benefits
  if (child.clientDentalBenefits) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-simplified-child:childrens-application.dental-benefits-title')}>
            {child.clientDentalBenefits.federalBenefit?.access || child.clientDentalBenefits.provTerrBenefit?.access ? (
              <div className="space-y-3">
                <p>{t('protected-application-simplified-child:childrens-application.dental-benefits-yes')}</p>
                <ul className="list-disc space-y-1 pl-7">
                  {child.clientDentalBenefits.federalBenefit?.access && <li>{child.clientDentalBenefits.federalBenefit.benefit}</li>}
                  {child.clientDentalBenefits.provTerrBenefit?.access && <li>{child.clientDentalBenefits.provTerrBenefit.benefit}</li>}
                </ul>
              </div>
            ) : (
              <p>{t('protected-application-simplified-child:childrens-application.dental-benefits-no')}</p>
            )}
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  // Case 4: No benefits at all - show help text
  return (
    <CardContent>
      <p>{t('protected-application-simplified-child:childrens-application.child-dental-benefits-indicate-status')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the child dental benefits card footer. The logic is as follows:
 *
 * - If the user has entered new dental benefits (child.dentalBenefits is defined), show the "Edit" button.
 *
 * - If the user has not entered new dental benefits but there are existing dental benefits on the parent
 *   application (child.clientDentalBenefits is defined), show both the "Update" button and the "Not changed" button.
 *
 * - If there are no dental benefits on the parent application and the user has not entered new dental benefits,
 *   show the "Add" button.
 */
function ChildDentalBenefitsCardFooter({ child, sectionCompleted, params }: { child: Route.ComponentProps['loaderData']['state']['children'][0]; sectionCompleted: boolean; params: Route.ComponentProps['params'] }): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    await fetcher.submit(formData, { method: 'POST' });
  }

  // Case 1: User has made changes or section is completed - show Edit button
  if (child.dentalBenefits || sectionCompleted) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id={`edit-child-benefits-${child.id}`}
          variant="link"
          className="p-0"
          routeId="protected/application/$id/children/$childId/federal-provincial-territorial-benefits"
          params={{ ...params, childId: child.id }}
          startIcon={faPenToSquare}
          size="lg"
        >
          {t('protected-application-simplified-child:childrens-application.edit-child-dental-benefits')}
        </ButtonLink>
      </CardFooter>
    );
  }

  // Case 2: No user changes yet, but client has existing benefits - show Update and Not Changed buttons
  if (child.clientDentalBenefits) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id={`update-child-benefits-${child.id}`}
            variant="link"
            className="p-0 pb-5"
            routeId="protected/application/$id/children/$childId/federal-provincial-territorial-benefits"
            params={{ ...params, childId: child.id }}
            startIcon={faPenToSquare}
            size="lg"
          >
            {t('protected-application-simplified-child:childrens-application.update-dental-benefits')}
          </ButtonLink>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
          <CsrfTokenInput />
          <input type="hidden" name="childId" value={child.id} />
          <div className="w-full px-6">
            <Button id={`complete-benefits-${child.id}`} name="_action" value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED} disabled={isSubmitting} variant="link" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
              {t('protected-application-simplified-child:childrens-application.benefits-not-changed')}
            </Button>
          </div>
        </fetcher.Form>
      </CardFooter>
    );
  }

  // Case 3: No benefits at all - show Add button
  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id={`add-child-benefits-${child.id}`}
        variant="link"
        className="p-0"
        routeId="protected/application/$id/children/$childId/federal-provincial-territorial-benefits"
        params={{ ...params, childId: child.id }}
        startIcon={faCirclePlus}
        size="lg"
      >
        {t('protected-application-simplified-child:childrens-application.add-child-dental-benefits')}
      </ButtonLink>
    </CardFooter>
  );
}

import type { SyntheticEvent } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'node:crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicRenewChildState } from '~/.server/routes/helpers/public-renew-child-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { ProgressStepper } from '~/components/progress-stepper';
import { StatusTag } from '~/components/status-tag';
import { useCurrentLanguage } from '~/hooks';
import { useProgressStepper } from '~/hooks/use-progress-stepper';
import { pageIds } from '~/page-ids';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = { add: 'add', remove: 'remove', DENTAL_BENEFITS_NOT_CHANGED: 'dental-benefits-not-changed' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-renew-child', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewChild.childApplication,
  pageTitleI18nKey: 'application-renew-child:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicRenewChildState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['renew-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-renew-child:childrens-application.page-title') }) };

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
      children: children,
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicRenewChildState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['renew-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.add) {
    const childId = randomUUID();
    const children = [...state.children, { id: childId }];

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

  return redirect(getPathById(`public/application/$id/${state.typeOfApplication}-${state.typeOfApplicationFlow}/childrens-application`, params));
}

export default function RenewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('renew-children', 'childrens-application');

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

  const allChildrenCompleted = state.children.length > 0 && state.children.every((child) => child.information !== undefined && child.dentalInsurance !== undefined && child.dentalBenefits !== undefined);

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper steps={steps} currentStep={currentStep} />
      {state.children.map((child, index) => {
        const childName = `${child.information?.firstName} ${child.information?.lastName}`;
        const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';

        const sections = [
          { id: 'child-information', completed: child.information !== undefined },
          { id: 'child-dental-insurance', completed: child.dentalInsurance !== undefined },
          { id: 'child-dental-benefits', completed: child.dentalBenefits !== undefined },
        ] as const;
        const completedSections = sections.filter((section) => section.completed).map((section) => section.id);

        return (
          <div key={child.id}>
            <h2 className="font-lato mb-4 text-2xl font-bold">{t('application-renew-child:childrens-application.child-title', { childNumber: index + 1 })}</h2>
            <div className="space-y-4">
              <p>{t('application:required-label')}</p>
              <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
            </div>
            <Card className="my-2">
              <CardHeader>
                <CardTitle>{t('application-renew-child:childrens-application.child-information-card-title', { childNumber: index + 1 })}</CardTitle>
                <CardAction>{completedSections.includes('child-information') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.information === undefined ? (
                  <p>{t('application-renew-child:childrens-application.child-information-indicate-status')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application-renew-child:childrens-application.member-id-title')}>
                      <p>{child.information.memberId}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-renew-child:childrens-application.full-name-title')}>
                      <p>{childName}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-renew-child:childrens-application.dob-title')}>
                      <p>{dateOfBirth}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-renew-child:childrens-application.sin-title')}>
                      <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-renew-child:childrens-application.parent-guardian-title')}>
                      <p>{child.information.isParent ? t('application-renew-child:childrens-application.yes') : t('application-renew-child:childrens-application.no')}</p>
                    </DefinitionListItem>
                  </DefinitionList>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/children/$childId/information" params={{ ...params, childId: child.id }} startIcon={faCirclePlus} size="lg">
                  {child.information === undefined ? t('application-renew-child:childrens-application.add-child-information') : t('application-renew-child:childrens-application.edit-child-information', { childNumber: index + 1 })}
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card className="my-2">
              <CardHeader>
                <CardTitle>{t('application-renew-child:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                <CardAction>{completedSections.includes('child-dental-insurance') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.dentalInsurance === undefined ? (
                  <p>{t('application-renew-child:childrens-application.child-dental-insurance-indicate-status')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application-renew-child:childrens-application.dental-insurance-title')}>
                      <p>{child.dentalInsurance.hasDentalInsurance ? t('application-renew-child:childrens-application.dental-insurance-yes') : t('application-renew-child:childrens-application.dental-insurance-no')}</p>
                    </DefinitionListItem>
                  </DefinitionList>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/children/$childId/dental-insurance" params={{ ...params, childId: child.id }} startIcon={faCirclePlus} size="lg">
                  {child.dentalInsurance === undefined ? t('application-renew-child:childrens-application.add-child-dental-insurance') : t('application-renew-child:childrens-application.edit-child-dental-insurance')}
                </ButtonLink>
              </CardFooter>
            </Card>

            <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
              <CsrfTokenInput />
              <input type="hidden" name="childId" value={child.id} />
              <Card className="my-2">
                <CardHeader>
                  <CardTitle>{t('application-renew-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                  <CardAction>{completedSections.includes('child-dental-benefits') && <StatusTag status="complete" />}</CardAction>
                </CardHeader>
                <CardContent>
                  {child.dentalBenefits ? (
                    <DefinitionList layout="single-column">
                      <DefinitionListItem term={t('application-renew-child:childrens-application.dental-benefits-title')}>
                        {child.dentalBenefits.hasChanged ? (
                          <>
                            {child.dentalBenefits.federalBenefit.access || child.dentalBenefits.provTerrBenefit.access ? (
                              <div className="space-y-3">
                                <p>{t('application-renew-child:childrens-application.dental-benefits-yes')}</p>
                                <ul className="list-disc space-y-1 pl-7">
                                  {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                                  {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                                </ul>
                              </div>
                            ) : (
                              <p>{t('application-renew-child:childrens-application.dental-benefits-no')}</p>
                            )}
                          </>
                        ) : (
                          <p>{t('application-renew-child:childrens-application.no-change')}</p>
                        )}
                      </DefinitionListItem>
                    </DefinitionList>
                  ) : (
                    <p>{t('application-renew-child:childrens-application.child-dental-benefits-indicate-status')}</p>
                  )}
                </CardContent>
                {child.dentalBenefits ? (
                  <CardFooter className="border-t bg-zinc-100">
                    <ButtonLink
                      id="edit-button-government-benefits"
                      variant="link"
                      className="p-0"
                      routeId="public/application/$id/children/$childId/federal-provincial-territorial-benefits"
                      params={{ ...params, childId: child.id }}
                      startIcon={faCirclePlus}
                      size="lg"
                    >
                      {t('application-renew-child:childrens-application.edit-child-dental-benefits')}
                    </ButtonLink>
                  </CardFooter>
                ) : (
                  <CardFooter className="divide-y border-t bg-zinc-100 px-0">
                    <div className="w-full px-6">
                      <ButtonLink
                        id="edit-button-update-access"
                        variant="link"
                        className="p-0 pb-5"
                        routeId="public/application/$id/children/$childId/federal-provincial-territorial-benefits"
                        params={{ ...params, childId: child.id }}
                        startIcon={faPenToSquare}
                        size="lg"
                      >
                        {t('application-renew-child:childrens-application.update-dental-benefits')}
                      </ButtonLink>
                    </div>
                    <div className="w-full px-6">
                      <Button id="edit-button-not-changed" name="_action" value={FORM_ACTION.DENTAL_BENEFITS_NOT_CHANGED} variant="link" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                        {t('application-renew-child:childrens-application.benefits-not-changed')}
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
              <Button
                id="remove-child"
                className="my-5"
                name="_action"
                value={FORM_ACTION.remove}
                disabled={isSubmitting}
                variant="secondary"
                size="sm"
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form-Child:Remove child - Child(ren) application click"
              >
                {t('application-renew-child:childrens-application.remove-child')}
              </Button>
            </fetcher.Form>
          </div>
        );
      })}
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <CsrfTokenInput />
        <Button variant="primary" id="add-child" name="_action" value={FORM_ACTION.add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form-Child:Add child - Child(ren) application click">
          {t('application-renew-child:childrens-application.add-child')}
        </Button>
      </fetcher.Form>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allChildrenCompleted} variant="primary" direction="next" routeId="public/application/$id/renew-children/submit" params={params}>
          {t('application-renew-child:childrens-application.submit-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/renew-children/parent-or-guardian" params={params}>
          {t('application-renew-child:childrens-application.back-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

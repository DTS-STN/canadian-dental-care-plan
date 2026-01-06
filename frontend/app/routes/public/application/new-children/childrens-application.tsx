import type { SyntheticEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'node:crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/childrens-application';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
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

const FORM_ACTION = { add: 'add', remove: 'remove' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-new-child', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.newChild.childApplication,
  pageTitleI18nKey: 'application-new-child:childrens-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-child:childrens-application.page-title') }) };

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const children = await Promise.all(
    state.children.map(async (child) => {
      const federalGovernmentInsurancePlanProgram =
        child.hasFederalProvincialTerritorialBenefits && child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;

      const provincialTerritorialSocialProgram =
        child.hasFederalProvincialTerritorialBenefits && child.dentalBenefits?.provincialTerritorialSocialProgram
          ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
          : undefined;

      const dentalBenefits = {
        federalBenefit: {
          access: child.dentalBenefits?.hasFederalBenefits,
          benefit: federalGovernmentInsurancePlanProgram?.name,
        },
        provTerrBenefit: {
          access: child.dentalBenefits?.hasProvincialTerritorialBenefits,
          benefit: provincialTerritorialSocialProgram?.name,
        },
      };

      return {
        ...child,
        dentalBenefits: child.dentalBenefits ? dentalBenefits : undefined,
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
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

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

export default function NewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-children', 'childrens-application');

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

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper steps={steps} currentStep={currentStep} />
      {state.children.map((child, index) => {
        const childName = `${child.information?.firstName} ${child.information?.lastName}`;
        const dateOfBirth = child.information?.dateOfBirth ? toLocaleDateString(parseDateString(child.information.dateOfBirth), currentLanguage) : '';

        const sections = [
          { id: 'child-information', completed: child.information !== undefined },
          { id: 'child-dental-insurance', completed: child.dentalInsurance !== undefined },
          { id: 'child-dental-benefits', completed: child.hasFederalProvincialTerritorialBenefits !== undefined },
        ] as const;
        const completedSections = sections.filter((section) => section.completed).map((section) => section.id);

        return (
          <div key={child.id}>
            <h2 className="font-lato mb-4 text-2xl font-bold">{t('application-new-child:childrens-application.child-title', { childNumber: index + 1 })}</h2>
            <div className="space-y-4">
              <p>{t('application:required-label')}</p>
              <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
            </div>
            <Card className="my-2">
              <CardHeader>
                <CardTitle>{t('application-new-child:childrens-application.child-information-card-title', { childNumber: index + 1 })}</CardTitle>
                <CardAction>{completedSections.includes('child-information') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.information === undefined ? (
                  <p>{t('application-new-child:childrens-application.child-information-indicate-status')}</p>
                ) : (
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:childrens-application.member-id-title')}>
                      <p>{child.id}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:childrens-application.full-name-title')}>
                      <p>{childName}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:childrens-application.dob-title')}>
                      <p>{dateOfBirth}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:childrens-application.sin-title')}>
                      <p>{child.information.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:childrens-application.parent-guardian-title')}>
                      <p>{child.information.isParent ? t('application-new-child:childrens-application.yes') : t('application-new-child:childrens-application.no')}</p>
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/children/$childId/information" params={{ ...params, childId: child.id }} startIcon={faCirclePlus} size="lg">
                  {child.information === undefined ? t('application-new-child:childrens-application.add-child-information') : t('application-new-child:childrens-application.edit-child-information', { childNumber: index + 1 })}
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card className="my-2">
              <CardHeader>
                <CardTitle>{t('application-new-child:childrens-application.child-dental-insurance-card-title')}</CardTitle>
                <CardAction>{completedSections.includes('child-dental-insurance') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.dentalInsurance === undefined ? (
                  <p>{t('application-new-child:childrens-application.child-dental-insurance-indicate-status')}</p>
                ) : (
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:childrens-application.dental-insurance-title')}>
                      <p>{child.dentalInsurance.hasDentalInsurance ? t('application-new-child:childrens-application.dental-insurance-yes') : t('application-new-child:childrens-application.dental-insurance-no')}</p>
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/children/$childId/dental-insurance" params={{ ...params, childId: child.id }} startIcon={faCirclePlus} size="lg">
                  {child.dentalInsurance === undefined ? t('application-new-child:childrens-application.add-child-dental-insurance') : t('application-new-child:childrens-application.edit-child-dental-insurance', { childNumber: index + 1 })}
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card className="my-2">
              <CardHeader>
                <CardTitle>{t('application-new-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                <CardAction>{completedSections.includes('child-dental-benefits') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.hasFederalProvincialTerritorialBenefits === undefined ? (
                  <p>{t('application-new-child:childrens-application.child-dental-benefits-indicate-status')}</p>
                ) : (
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:childrens-application.dental-benefits-title')}>
                      {child.hasFederalProvincialTerritorialBenefits === true ? (
                        <>
                          <p>{t('application-new-child:childrens-application.dental-benefits-yes')}</p>
                          {child.dentalBenefits?.federalBenefit.access || child.dentalBenefits?.provTerrBenefit.access ? (
                            <>
                              <p>{t('application-new-child:childrens-application.yes')}</p>
                              <ul className="ml-6 list-disc">
                                {child.dentalBenefits.federalBenefit.access && <li>{child.dentalBenefits.federalBenefit.benefit}</li>}
                                {child.dentalBenefits.provTerrBenefit.access && <li>{child.dentalBenefits.provTerrBenefit.benefit}</li>}
                              </ul>
                            </>
                          ) : (
                            <p>{t('application-new-child:childrens-application.no')}</p>
                          )}
                        </>
                      ) : (
                        <p>{t('application-new-child:childrens-application.dental-benefits-no')}</p>
                      )}
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/children/$childId/confirm-federal-provincial-territorial-benefits" params={{ ...params, childId: child.id }} startIcon={faCirclePlus} size="lg">
                  {child.hasFederalProvincialTerritorialBenefits === undefined
                    ? t('application-new-child:childrens-application.add-child-dental-benefits')
                    : t('application-new-child:childrens-application.edit-child-dental-benefits', { childNumber: index + 1 })}
                </ButtonLink>
              </CardFooter>
            </Card>
            <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Remove child - Child(ren) application click"
              >
                {t('application-new-child:childrens-application.remove-child')}
              </Button>
            </fetcher.Form>
          </div>
        );
      })}
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <CsrfTokenInput />
        <Button variant="primary" id="add-child" name="_action" value={FORM_ACTION.add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Add child - Child(ren) application click">
          {t('application-new-child:childrens-application.add-child')}
        </Button>
      </fetcher.Form>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink variant="primary" direction="next" routeId="public/application/$id/new-children/submit" params={params}>
          {t('application-new-child:childrens-application.submit-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/new-children/parent-or-guardian" params={params}>
          {t('application-new-child:childrens-application.back-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

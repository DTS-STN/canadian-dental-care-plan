import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/childrens-application';

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
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

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

      return { ...child, dentalBenefits: { ...child.dentalBenefits, federalSocialProgram: federalGovernmentInsurancePlanProgram?.name, provincialTerritorialSocialProgram: provincialTerritorialSocialProgram?.name } };
    }),
  );

  return {
    state: {
      children: children,
    },
    meta,
  };
}

export default function NewChildChildrensApplication({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-children', 'childrens-application');

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
        //const allSectionsCompleted = completedSections.length === sections.length;

        return (
          <div key={child.id}>
            <h2 className="font-lato mb-4 text-2xl font-bold">{t('application-new-child:childrens-application.child-title', { childNumber: index })}</h2>
            <div className="space-y-4">
              <p>{t('application:required-label')}</p>
              <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t('application-new-child:childrens-application.child-information-card-title', { childNumber: index })}</CardTitle>
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
                      <p>{child.information?.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}</p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('application-new-child:childrens-application.parent-guardian-title')}>
                      <p>{child.parentOrGuardian ? t('application-new-child:childrens-application.yes') : t('application-new-child:childrens-application.no')}</p>
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/child-information" params={params} startIcon={faCirclePlus} size="lg">
                  {state.dentalInsurance === undefined ? t('application-new-child:childrens-application.add-child-information') : t('application-new-child:childrens-application.edit-child-information')}
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card>
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
                      <p>{child.parentOrGuardian ? t('application-new-child:childrens-application.yes') : t('application-new-child:childrens-application.no')}</p>
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
                  {state.dentalBenefits === undefined ? t('application-new-child:childrens-application.add-child-dental-insurance') : t('application-new-child:childrens-application.edit-child-dental-insurance')}
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('application-new-child:childrens-application.child-dental-benefits-card-title')}</CardTitle>
                <CardAction>{completedSections.includes('child-dental-benefits') && <StatusTag status="complete" />}</CardAction>
              </CardHeader>
              <CardContent>
                {child.dentalBenefits === undefined ? (
                  <p>{t('application-new-child:childrens-application.child-dental-benefits-indicate-status')}</p>
                ) : (
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('application-new-child:childrens-application.dental-benefits-title')}>
                      <p>{child.parentOrGuardian ? t('application-new-child:childrens-application.yes') : t('application-new-child:childrens-application.no')}</p>
                      {!!child.dentalBenefits.hasFederalBenefits || !!child.dentalBenefits.hasProvincialTerritorialBenefits ? (
                        <>
                          <p>{t('application-new-child:childrens-application.yes')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalBenefits.hasFederalBenefits && <li>{child.dentalBenefits.federalSocialProgram}</li>}
                              {child.dentalBenefits.hasProvincialTerritorialBenefits && <li>{child.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('application-new-child:childrens-application.no')}</>
                      )}
                    </DescriptionListItem>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="border-t bg-zinc-100">
                <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/federal-provincial-territorial-benefits" params={params} startIcon={faCirclePlus} size="lg">
                  {state.dentalBenefits === undefined ? t('application-new-child:childrens-application.add-child-dental-benefits') : t('application-new-child:childrens-application.edit-child-dental-benefits')}
                </ButtonLink>
              </CardFooter>
            </Card>
          </div>
        );
      })}

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink /*disabled={!allSectionsCompleted}*/ variant="primary" direction="next" routeId="public/application/$id/new-child/submit" params={params}>
          {t('application-new-child:childrens-application.submit-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/new-child/parent-or-guardian" params={params}>
          {t('application-new-child:childrens-application.back-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

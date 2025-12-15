import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

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
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-child', 'gcweb'),
  pageIdentifier: pageIds.public.application.newChild.parentOrGuardian,
  pageTitleI18nKey: 'application-new-child:parent-or-guardian.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-child:parent-or-guardian.page-title') }) };
  const locale = getLocale(request);

  // TODO add remainder of communication preferences

  return {
    state: {
      maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined,
      partnerInformation: state.partnerInformation,
    },
    meta,
  };
}

export default function NewChildParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-children', 'parent-or-guardian');

  const sections = [
    { id: 'marital-status', completed: state.maritalStatus !== undefined }, //
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
          <CardTitle>{t('application-new-child:parent-or-guardian.marital-status')}</CardTitle>
          <CardAction>{completedSections.includes('marital-status') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.maritalStatus === undefined ? (
            <p>{t('application-new-child:parent-or-guardian.select-your-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.marital-status')}>
                <p>{state.maritalStatus.name}</p>
              </DescriptionListItem>
              {state.partnerInformation && (
                <>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.spouse-sin')}>
                    <p>{state.partnerInformation.socialInsuranceNumber}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.spouse-yob')}>
                    <p>{state.partnerInformation.yearOfBirth}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.consent')}>
                    {state.partnerInformation.confirm ? t('application-new-child:parent-or-guardian.consent-yes') : t('application-new-child:parent-or-guardian.consent-no')}
                  </DescriptionListItem>
                </>
              )}
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/marital-status" params={params} startIcon={faCirclePlus} size="lg">
            {state.maritalStatus === undefined ? t('application-new-child:parent-or-guardian.add-marital-status') : t('application-new-child:parent-or-guardian.edit-marital-status')}
          </ButtonLink>
        </CardFooter>
      </Card>

      {/* TODO add remainder of communication preferences */}

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        {/* TODO: update with correct route */}
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-adult/contact-information" params={params}>
          {t('application-new-child:parent-or-guardian.childrens-application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
          {t('application-new-child:parent-or-guardian.type-of-application')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

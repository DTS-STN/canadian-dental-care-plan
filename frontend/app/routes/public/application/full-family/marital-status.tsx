import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullFamilyState } from '~/.server/routes/helpers/public-application-full-family-route-helpers';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-family', 'gcweb'),
  pageIdentifier: pageIds.public.application.newFamily.maritalStatus,
  pageTitleI18nKey: 'application-full-family:marital-status.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['full-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-family:marital-status.page-title') }) };
  const locale = getLocale(request);
  return {
    state: {
      maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined,
      partnerInformation: state.partnerInformation,
    },
    meta,
  };
}

export default function NewFamilyMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('full-family', 'marital-status');

  const sections = [
    {
      id: 'marital-status',
      completed:
        state.maritalStatus !== undefined && // marital status selected
        (!state.partnerInformation || // marital status has no partner information
          state.partnerInformation.confirm === true), // marital status has partner information with consent given
    },
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
          <CardTitle>{t('application-full-family:marital-status.marital-status')}</CardTitle>
          <CardAction>{completedSections.includes('marital-status') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.maritalStatus === undefined ? (
            <p>{t('application-full-family:marital-status.select-your-status')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem term={t('application-full-family:marital-status.marital-status')}>
                <p>{state.maritalStatus.name}</p>
              </DefinitionListItem>
              {state.partnerInformation && (
                <>
                  <DefinitionListItem term={t('application-full-family:marital-status.spouse-sin')}>
                    <p>{state.partnerInformation.socialInsuranceNumber}</p>
                  </DefinitionListItem>
                  <DefinitionListItem term={t('application-full-family:marital-status.spouse-yob')}>
                    <p>{state.partnerInformation.yearOfBirth}</p>
                  </DefinitionListItem>
                  <DefinitionListItem term={t('application-full-family:marital-status.consent')}>
                    {state.partnerInformation.confirm ? t('application-full-family:marital-status.consent-yes') : t('application-full-family:marital-status.consent-no')}
                  </DefinitionListItem>
                </>
              )}
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/marital-status" params={params} startIcon={faCirclePlus} size="lg">
            {state.maritalStatus === undefined ? t('application-full-family:marital-status.add-marital-status') : t('application-full-family:marital-status.edit-marital-status')}
          </ButtonLink>
        </CardFooter>
      </Card>
      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/full-family/contact-information" params={params}>
          {t('application-full-family:marital-status.contact-information')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
          {t('application-full-family:marital-status.type-of-application')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

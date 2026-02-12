import { invariant } from '@dts-stn/invariant';
import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { isRenewalSelectionCompleted } from '~/.server/routes/helpers/protected-application-entry-section-checks';
import { getInitialApplicationFlowUrl, getProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.typeOfApplication,
  pageTitleI18nKey: 'protected-application:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.application.entry.type-of-application', { userId: idToken.sub });

  const state = getProtectedApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application:type-of-application.page-title') }) };

  const applicationFlow: ApplicationFlow = state.typeOfApplication ? `${state.inputModel}-${state.typeOfApplication}` : 'entry';
  const nextRouteId = getInitialApplicationFlowUrl(applicationFlow, params);

  const applicants = state.clientApplication
    ? [
        { id: state.clientApplication.applicantInformation.clientId, name: `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}` },
        ...state.clientApplication.children.map((child) => ({ id: child.information.clientId, name: `${child.information.firstName} ${child.information.lastName}` })),
      ].filter(({ id }) => state.applicantClientIdsToRenew?.includes(id))
    : [];

  return {
    defaultState: {
      inputModel: state.inputModel,
      typeOfApplication: state.typeOfApplication,
      applicantClientIdsToRenew: state.applicantClientIdsToRenew,
    },
    applicants,
    nextRouteId,
    sections: {
      applicantClientIdsToRenew: { completed: isRenewalSelectionCompleted(state) },
    },
    meta,
  };
}

export default function ProtectedTypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, applicants, nextRouteId, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('protected-application:required-label')}</p>
        <p>{completedSectionsLabel}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('protected-application:type-of-application.type-application-heading')}</CardTitle>
          <CardAction>{sections.applicantClientIdsToRenew.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.applicantClientIdsToRenew === undefined ? (
            <p>{t('protected-application:type-of-application.type-application-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.type-application-legend')}>
                <ul className="list-disc space-y-1 pl-7">
                  {applicants.map(({ id, name }) => (
                    <li key={id}>{name}</li>
                  ))}
                </ul>
              </DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="type-of-application-edit-button" variant="link" className="p-0" routeId="protected/application/$id/renewal-selection" params={params} startIcon={defaultState.applicantClientIdsToRenew ? faPenToSquare : faCirclePlus} size="lg">
            {defaultState.applicantClientIdsToRenew === undefined ? t('protected-application:type-of-application.add-type-application') : t('protected-application:type-of-application.edit-type-application')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" to={nextRouteId}>
          {t('protected-application:type-of-application.application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/eligibility-requirements" params={params}>
          {t('protected-application:type-of-application.before-you-start')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

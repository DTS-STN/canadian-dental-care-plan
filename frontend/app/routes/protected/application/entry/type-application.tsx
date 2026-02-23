import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { isPersonalInformationSectionCompleted, isTypeOfApplicationSectionCompleted } from '~/.server/routes/helpers/protected-application-entry-section-checks';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getInitialApplicationFlowUrl, getProtectedApplicationState, validateProtectedApplicationContext } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber } from '~/utils/application-code-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.typeOfApplication,
  pageTitleI18nKey: 'protected-application:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateProtectedApplicationContext(state, params, 'intake');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application:type-of-application.page-title') }) };

  const applicationFlow: ApplicationFlow = state.typeOfApplication ? `${state.context}-${state.typeOfApplication}` : 'entry';
  const nextRouteId = getInitialApplicationFlowUrl(applicationFlow, params);
  return {
    defaultState: {
      context: state.context,
      typeOfApplication: state.typeOfApplication,
      personalInformation: state.applicantInformation,
    },
    nextRouteId,
    sections: {
      typeOfApplication: { completed: isTypeOfApplicationSectionCompleted(state) },
      personalInformation: { completed: isPersonalInformationSectionCompleted(state) },
    },
    meta,
  };
}

export default function TypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, nextRouteId, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  function getTypeOfApplication(typeOfApplication: string) {
    switch (typeOfApplication) {
      case APPLICANT_TYPE.adult: {
        return t('protected-application:type-of-application.type-application-personal');
      }
      case APPLICANT_TYPE.family: {
        return t('protected-application:type-of-application.type-application-family');
      }
      case APPLICANT_TYPE.children: {
        return t('protected-application:type-of-application.type-application-children');
      }
      default: {
        return '';
      }
    }
  }

  const formattedDate = defaultState.personalInformation ? format(parseISO(defaultState.personalInformation.dateOfBirth), 'MMMM d, yyyy') : undefined;

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('protected-application:complete-all-sections')}</p>
        <p>{completedSectionsLabel}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('protected-application:type-of-application.type-application-heading')}</CardTitle>
          <CardAction>{sections.typeOfApplication.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.typeOfApplication === undefined ? (
            <p>{t('protected-application:type-of-application.type-application-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.type-application-legend')}>
                {getTypeOfApplication(defaultState.typeOfApplication)}
              </DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="type-of-application-edit-button" variant="link" className="p-0" routeId="protected/application/$id/type-application" params={params} startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus} size="lg">
            {defaultState.typeOfApplication === undefined ? t('protected-application:type-of-application.add-type-application') : t('protected-application:type-of-application.edit-type-application')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('protected-application:type-of-application.personal-info-heading')}</CardTitle>
          <CardAction>{sections.personalInformation.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.personalInformation === undefined ? (
            <p>{t('protected-application:type-of-application.personal-info-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              {defaultState.personalInformation.memberId && (
                <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.member-id')}>
                  {formatClientNumber(defaultState.personalInformation.memberId)}
                </DefinitionListItem>
              )}
              <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.full-name')}>
                {`${defaultState.personalInformation.firstName} ${defaultState.personalInformation.lastName}`}
              </DefinitionListItem>
              <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.date-of-birth')}>
                {formattedDate}
              </DefinitionListItem>
              <DefinitionListItem className="sm:grid-cols-none" term={t('protected-application:type-of-application.sin')}>
                {formatSin(defaultState.personalInformation.socialInsuranceNumber)}
              </DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="personal-information-edit-button" variant="link" className="p-0" routeId="protected/application/$id/personal-information" params={params} startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus} size="lg">
            {defaultState.personalInformation === undefined ? t('protected-application:type-of-application.add-personal-information') : t('protected-application:type-of-application.edit-personal-information')}
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

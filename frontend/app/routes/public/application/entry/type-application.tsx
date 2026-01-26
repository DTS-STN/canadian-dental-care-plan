import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/type-application';

import type { ApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getInitialTypeAndFlowUrl, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'gcweb'),
  pageIdentifier: pageIds.public.application.typeOfApplication,
  pageTitleI18nKey: 'application:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application:type-of-application.page-title') }) };

  const applicationFlow: ApplicationFlow = state.inputModel && state.typeOfApplicationFlow ? `${state.inputModel}-${state.typeOfApplicationFlow}` : 'entry';
  const nextRouteId = getInitialTypeAndFlowUrl(applicationFlow, params);
  return {
    defaultState: {
      typeOfApplication: state.typeOfApplicationFlow,
      personalInformation: state.applicantInformation,
    },
    nextRouteId,
    meta,
  };
}

export default function TypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, nextRouteId } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  function getTypeOfApplication(typeOfApplication: string) {
    switch (typeOfApplication) {
      case APPLICANT_TYPE.adult: {
        return t('application:type-of-application.type-application-personal');
      }
      case APPLICANT_TYPE.family: {
        return t('application:type-of-application.type-application-family');
      }
      case APPLICANT_TYPE.children: {
        return t('application:type-of-application.type-application-children');
      }
      default: {
        return '';
      }
    }
  }

  const formattedDate = defaultState.personalInformation ? format(parseISO(defaultState.personalInformation.dateOfBirth), 'MMMM d, yyyy') : undefined;

  const sections = [
    { id: 'type-application', completed: defaultState.typeOfApplication !== undefined && defaultState.typeOfApplication !== 'delegate' },
    { id: 'personal-information', completed: defaultState.personalInformation !== undefined },
  ];

  const completedSections = sections.filter((section) => section.completed).map((section) => section.id);
  const allSectionsCompleted = completedSections.length === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('application:required-label')}</p>
        <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('application:type-of-application.type-application-heading')}</CardTitle>
          <CardAction>{completedSections.includes('type-application') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.typeOfApplication === undefined ? (
            <p>{t('application:type-of-application.type-application-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem className="sm:grid-cols-none" term={t('application:type-of-application.type-application-legend')}>
                {getTypeOfApplication(defaultState.typeOfApplication)}
              </DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/type-application" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.typeOfApplication === undefined ? t('application:type-of-application.add-type-application') : t('application:type-of-application.edit-type-application')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application:type-of-application.personal-info-heading')}</CardTitle>
          <CardAction>{completedSections.includes('personal-information') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.personalInformation === undefined ? (
            <p>{t('application:type-of-application.personal-info-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              {defaultState.personalInformation.memberId && (
                <DefinitionListItem className="sm:grid-cols-none" term={t('application:type-of-application.member-id')}>
                  {defaultState.personalInformation.memberId}
                </DefinitionListItem>
              )}
              <DefinitionListItem className="sm:grid-cols-none" term={t('application:type-of-application.full-name')}>
                {`${defaultState.personalInformation.firstName} ${defaultState.personalInformation.lastName}`}
              </DefinitionListItem>
              <DefinitionListItem className="sm:grid-cols-none" term={t('application:type-of-application.date-of-birth')}>
                {formattedDate}
              </DefinitionListItem>
              <DefinitionListItem className="sm:grid-cols-none" term={t('application:type-of-application.sin')}>
                {defaultState.personalInformation.socialInsuranceNumber}
              </DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/personal-information" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.personalInformation === undefined ? t('application:type-of-application.add-personal-information') : t('application:type-of-application.edit-personal-information')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" to={nextRouteId}>
          {t('application:type-of-application.application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/eligibility-requirements" params={params}>
          {t('application:type-of-application.before-you-start')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

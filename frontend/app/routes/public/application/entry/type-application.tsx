import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/type-application';

import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ApplicantCard, ApplicantCardBody, ApplicantCardFooter, ApplicantCardHeader, ApplicantCardTitle } from '~/components/applicant-card';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
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
  return {
    defaultState: {
      typeOfApplication: state.typeOfApplicationFlow,
      personalInformation: state.applicantInformation,
      newOrReturningMember: state.newOrExistingMember,
    },
    meta,
  };
}

export default function TypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState } = loaderData;
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

  const sections = [
    { id: 'type-application', completed: defaultState.typeOfApplication !== undefined },
    { id: 'personal-information', completed: defaultState.personalInformation !== undefined },
    { id: 'new-or-returning-member', completed: defaultState.newOrReturningMember !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).length;
  const allSectionsCompleted = completedSections === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <p>{t('application:required-label')}</p>
      <p>{t('application:sections-completed', { number: completedSections, count: sections.length })}</p>
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application:type-of-application.type-application-heading')}</ApplicantCardTitle>
          {defaultState.typeOfApplication && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.typeOfApplication === undefined ? (
            <p>{t('application:type-of-application.type-application-description')}</p>
          ) : (
            <dl className="divide-hidden">
              <DescriptionListItem className="sm:grid-cols-none" term={t('application:type-of-application.type-application-legend')}>
                <p>{getTypeOfApplication(defaultState.typeOfApplication)}</p>
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/type-application" params={params} startIcon={faCirclePlus}>
            {defaultState.typeOfApplication === undefined ? t('application:type-of-application.add-type-application') : t('application:type-of-application.edit-type-application')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application:type-of-application.personal-info-heading')}</ApplicantCardTitle>
          {defaultState.personalInformation && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.personalInformation === undefined ? (
            <p>{t('application:type-of-application.personal-info-description')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem className="sm:grid-cols-none" term={t('application:type-of-application.member-id')}>
                <p>{defaultState.personalInformation.memberId}</p>
              </DescriptionListItem>
              <DescriptionListItem className="sm:grid-co ls-none" term={t('application:type-of-application.full-name')}>
                <p>{`${defaultState.personalInformation.firstName} ${defaultState.personalInformation.lastName}`}</p>
              </DescriptionListItem>
              <DescriptionListItem className="sm:grid-cols-none" term={t('application:type-of-application.date-of-birth')}>
                <p>{defaultState.personalInformation.dateOfBirth}</p>
              </DescriptionListItem>
              <DescriptionListItem className="sm:grid-cols-none" term={t('application:type-of-application.sin')}>
                <p>{defaultState.personalInformation.socialInsuranceNumber}</p>
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          {/* TODO: Update routeId to personal-information route when created */}
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/type-of-application" params={params} startIcon={faCirclePlus}>
            {defaultState.personalInformation === undefined ? t('application:type-of-application.add-personal-information') : t('application:type-of-application.edit-personal-information')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      {defaultState.personalInformation !== undefined && (
        <ApplicantCard>
          <ApplicantCardHeader>
            <ApplicantCardTitle>{t('application:type-of-application.new-or-returning-heading')}</ApplicantCardTitle>
            {defaultState.newOrReturningMember && <StatusTag status="complete" />}
          </ApplicantCardHeader>
          {/* TODO: Need to confirm the value to be displayed for new or returning member*/}
          <ApplicantCardBody>{defaultState.newOrReturningMember === undefined ? <p>{t('application:type-of-application.new-or-returning-description')}</p> : <p>{defaultState.newOrReturningMember.isNewOrExistingMember}</p>}</ApplicantCardBody>
          <ApplicantCardFooter>
            <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/new-or-returning-member" params={params} startIcon={faCirclePlus}>
              {defaultState.newOrReturningMember === undefined ? t('application:type-of-application.add-answer') : t('application:type-of-application.edit-answer')}
            </ButtonLink>
          </ApplicantCardFooter>
        </ApplicantCard>
      )}

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink variant="primary" direction="next" routeId="public/application/$id/type-of-application" params={params}>
          {t('application:type-of-application.application')}
        </NavigationButtonLink>
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="secondary" direction="previous" routeId="public/application/$id/eligibility-requirements" params={params}>
          {t('application:type-of-application.before-you-start')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

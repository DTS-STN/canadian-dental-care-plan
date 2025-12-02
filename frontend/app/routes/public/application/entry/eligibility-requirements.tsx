import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/eligibility-requirements';

import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ApplicantCard, ApplicantCardBody, ApplicantCardFooter, ApplicantCardHeader, ApplicantCardTitle } from '~/components/applicant-card';
import { ButtonLink } from '~/components/buttons';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'gcweb', 'common'),
  pageIdentifier: pageIds.public.application.eligibilityRequirements,
  pageTitleI18nKey: 'application:eligibility-requirements.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application:eligibility-requirements.page-title') }) };
  return {
    defaultState: {
      termsAndConditions: state.termsAndConditions,
    },
    meta,
  };
}

export default function ApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { defaultState } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const sections = [{ id: 'terms-and-conditions', completed: defaultState.termsAndConditions !== undefined }] as const;
  const completedSections = sections.filter((section) => section.completed).length;
  const allSectionsCompleted = completedSections === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <p>{t('application:sections-completed', { number: completedSections, count: sections.length })}</p>
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application:eligibility-requirements.terms-conditions-section.title')}</ApplicantCardTitle>
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          {sections.some((section) => section.id === 'terms-and-conditions' && section.completed) && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.termsAndConditions === undefined ? (
            <p>{t('application:eligibility-requirements.terms-conditions-section.instructions')}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-7">
              {defaultState.termsAndConditions.acknowledgeTerms && <li>{t('application:eligibility-requirements.terms-conditions-section.acknowledge-terms')}</li>}
              {defaultState.termsAndConditions.acknowledgePrivacy && <li>{t('application:eligibility-requirements.terms-conditions-section.acknowledge-privacy')}</li>}
              {defaultState.termsAndConditions.shareData && <li>{t('application:eligibility-requirements.terms-conditions-section.share-data')}</li>}
            </ul>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          {defaultState.termsAndConditions === undefined ? (
            <ButtonLink id="add-button" variant="link" routeId="public/application/$id/terms-conditions" params={params} startIcon={faCircleCheck} size="lg">
              {t('application:eligibility-requirements.terms-conditions-section.add-button')}
            </ButtonLink>
          ) : (
            <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/terms-conditions" params={params} startIcon={faPenToSquare} size="lg">
              {t('application:eligibility-requirements.terms-conditions-section.edit-button')}
            </ButtonLink>
          )}
        </ApplicantCardFooter>
      </ApplicantCard>
      <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-adult/marital-status" params={params}>
        {t('application:eligibility-requirements.next-button')}
      </NavigationButtonLink>
    </div>
  );
}

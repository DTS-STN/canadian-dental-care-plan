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
    state: {
      termsAndConditions: state.termsAndConditions,
      hasFiledTaxes: state.hasFiledTaxes,
    },
    meta,
  };
}

export default function ApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const sections = [
    { id: 'terms-and-conditions', completed: state.termsAndConditions !== undefined }, //
    { id: 'tax-filing', completed: state.hasFiledTaxes !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).length;
  const allSectionsCompleted = completedSections === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('application:required-label')}</p>
        <p>{t('application:sections-completed', { number: completedSections, count: sections.length })}</p>
      </div>
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application:eligibility-requirements.terms-conditions-section.title')}</ApplicantCardTitle>
          {sections.some((section) => section.id === 'terms-and-conditions' && section.completed) && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {state.termsAndConditions === undefined ? (
            <p>{t('application:eligibility-requirements.terms-conditions-section.instructions')}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-7">
              {state.termsAndConditions.acknowledgeTerms && <li>{t('application:eligibility-requirements.terms-conditions-section.acknowledge-terms')}</li>}
              {state.termsAndConditions.acknowledgePrivacy && <li>{t('application:eligibility-requirements.terms-conditions-section.acknowledge-privacy')}</li>}
              {state.termsAndConditions.shareData && <li>{t('application:eligibility-requirements.terms-conditions-section.share-data')}</li>}
            </ul>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          {state.termsAndConditions === undefined ? (
            <ButtonLink id="add-terms-conditions-button" variant="link" routeId="public/application/$id/terms-conditions" params={params} startIcon={faCircleCheck} size="lg">
              {t('application:eligibility-requirements.terms-conditions-section.add-button')}
            </ButtonLink>
          ) : (
            <ButtonLink id="edit-terms-conditions-button" variant="link" routeId="public/application/$id/terms-conditions" params={params} startIcon={faPenToSquare} size="lg">
              {t('application:eligibility-requirements.terms-conditions-section.edit-button')}
            </ButtonLink>
          )}
        </ApplicantCardFooter>
      </ApplicantCard>
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application:eligibility-requirements.tax-filing-section.title')}</ApplicantCardTitle>
          {sections.some((section) => section.id === 'tax-filing' && section.completed) && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {state.termsAndConditions === undefined ? <p>{t('application:eligibility-requirements.tax-filing-section.instructions')}</p> : <p>{t('application:eligibility-requirements.tax-filing-section.have-filed-taxes')}</p>}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          {state.termsAndConditions === undefined ? (
            <ButtonLink id="add-tax-filing-button" variant="link" routeId="public/application/$id/tax-filing" params={params} startIcon={faCircleCheck} size="lg">
              {t('application:eligibility-requirements.tax-filing-section.add-button')}
            </ButtonLink>
          ) : (
            <ButtonLink id="edit-tax-filing-button" variant="link" routeId="public/application/$id/tax-filing" params={params} startIcon={faPenToSquare} size="lg">
              {t('application:eligibility-requirements.tax-filing-section.edit-button')}
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

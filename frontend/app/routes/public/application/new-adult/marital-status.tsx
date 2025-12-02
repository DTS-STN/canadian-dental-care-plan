import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ApplicantCard, ApplicantCardBody, ApplicantCardFooter, ApplicantCardHeader, ApplicantCardTitle } from '~/components/applicant-card';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { ProgressStepper } from '~/components/progress-stepper';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.maritalStatus,
  pageTitleI18nKey: 'application-new-adult:marital-status.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-adult:marital-status.page-title') }) };
  return {
    state: {
      maritalStatus: state.maritalStatus,
      partnerInformation: state.partnerInformation,
    },
    meta,
  };
}

export default function NewAdultMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const sections = [
    { id: 'marital-status', completed: state.maritalStatus !== undefined }, //
  ] as const;
  const completedSections = sections.filter((section) => section.completed).length;
  const allSectionsCompleted = completedSections === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper
        steps={[
          { id: 'marital-status', status: 'active', description: t('application:progress-stepper.marital-status') },
          { id: 'contact-information', status: 'inactive', description: t('application:progress-stepper.contact-information') },
          { id: 'dental-insurance', status: 'inactive', description: t('application:progress-stepper.dental-insurance') },
          { id: 'submit', status: 'inactive', description: t('application:progress-stepper.submit') },
        ]}
        currentStep={0}
      />

      <div className="space-y-4">
        <p>{t('application:required-label')}</p>
        <p>{t('application:sections-completed', { number: completedSections, count: sections.length })}</p>
      </div>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:marital-status.marital-status')}</ApplicantCardTitle>
          {state.maritalStatus !== undefined && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {state.maritalStatus === undefined ? (
            <p>{t('application-new-adult:marital-status.select-your-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:marital-status.marital-status')}>
                <p>{state.maritalStatus}</p>
              </DescriptionListItem>
              {state.partnerInformation && (
                <>
                  <DescriptionListItem term={t('application-new-adult:marital-status.spouse-sin')}>
                    <p>{state.partnerInformation.socialInsuranceNumber}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-adult:marital-status.spouse-yob')}>
                    <p>{state.partnerInformation.yearOfBirth}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-adult:marital-status.consent')}>
                    {state.partnerInformation.confirm ? t('application-new-adult:marital-status.consent-yes') : t('application-new-adult:marital-status.consent-no')}
                  </DescriptionListItem>
                </>
              )}
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/marital-status" params={params} startIcon={faCirclePlus} size="lg">
            {state.maritalStatus === undefined ? t('application-new-adult:marital-status.add-marital-status') : t('application-new-adult:marital-status.edit-marital-status')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:marital-status.contact-information')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
          {t('application-new-adult:marital-status.type-of-application')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

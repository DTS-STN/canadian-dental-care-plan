import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

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

export const PREFERRED_SUN_LIFE_METHOD = { email: 'email', mail: 'mail' } as const;
export const PREFERRED_NOTIFICATION_METHOD = { msca: 'msca', mail: 'mail' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.contactInformation,
  pageTitleI18nKey: 'application-new-adult:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-adult:contact-information.page-title') }) };
  return {
    defaultState: {
      phoneNumber: state.contactInformation,
      mailingAddress: state.mailingAddress,
      homeAddress: state.homeAddress,
      preferredLanguage: state.communicationPreferences?.preferredLanguage,
      preferredMethod: state.communicationPreferences?.preferredMethod ?? PREFERRED_SUN_LIFE_METHOD.email,
      preferredNotificationMethod: state.communicationPreferences?.preferredNotificationMethod ?? PREFERRED_NOTIFICATION_METHOD.msca,
    },
    meta,
  };
}

export default function NewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { defaultState } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper
        steps={[
          { id: 'marital-status', status: 'inactive', description: t('application:progress-stepper.marital-status') },
          { id: 'contact-information', status: 'inactive', description: t('application:progress-stepper.contact-information') },
          { id: 'dental-insurance', status: 'active', description: t('application:progress-stepper.dental-insurance') },
          { id: 'submit', status: 'inactive', description: t('application:progress-stepper.submit') },
        ]}
        currentStep={2}
      />
      <p>{t('application:required-label')}</p>
      <p>{t('application:sections-completed', { number: defaultState.maritalStatus === undefined ? 0 : 1 })}</p>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:contact-information.phone-number')}</ApplicantCardTitle>
          {defaultState.contactInformation.phoneNumber !== undefined && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.contactInformation.phoneNumber === undefined ? (
            <p>{t('application-new-adult:contact-information.phone-number-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:contact-information.phone-number')}>
                <p>{defaultState.contactInformation.phoneNumber}</p>
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/contact-information" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.contactInformation.phoneNumber === undefined ? t('application-new-adult:contact-information.add-phone-number') : t('application-new-adult:contact-information.edit-phone-number')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:contact-information.mailing-and-home-address')}</ApplicantCardTitle>
          {defaultState.contactInformation.mailingAddress && defaultState.contactInformation.homeAddress && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.contactInformation.mailingAddress === undefined ? (
            <p>{t('application-new-adult:contact-information.address-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:contact-information.mailing-address')}>
                <p>{t('application-new-adult:contact-information.mailing-address')}</p>
                {defaultState.contactInformation.mailingAddress}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.home-address')}>
                <p>{t('application-new-adult:contact-information.home-address')}</p>
                {defaultState.contactInformation.homeAddress}
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/new-adult/contact-information" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.contactInformation.mailingAddress || defaultState.contactInformation.homeAddress ? t('application-new-adult:contact-information.add-address') : t('application-new-adult:contact-information.edit-address')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:contact-information.communication-preferences')}</ApplicantCardTitle>
          {defaultState.contactInformation.communicationPreferences && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.contactInformation.communicationPreferences.preferredLanguage === undefined ? (
            <p>{t('application-new-adult:contact-information.communication-preferences-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:contact-information.preferrred-language')}>
                <p>{t('application-new-adult:contact-information.preferrred-language')}</p>
                {defaultState.contactInformation.communicationPreferences.preferrredLanguage}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.preferrred-method')}>
                <p>{t('application-new-adult:contact-information.preferrred-method')}</p>
                {defaultState.contactInformation.communicationPreferences.preferrredMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.preferrred-notification-method')}>
                <p>{t('application-new-adult:contact-information.preferrred-notification-method')}</p>
                {defaultState.contactInformation.communicationPreferences.preferredNotificationMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.email')}>
                <p>{t('application-new-adult:contact-information.email')}</p>
                {defaultState.contactInformation.communicationPreferences.email}
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/new-adult/contact-information" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.contactInformation.communicationPreferences ? t('application-new-adult:contact-information.add-communication-preferences') : t('application-new-adult:contact-information.edit-communication-preferences')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink variant="secondary" direction="next" routeId="public/application/$id/new-adult/dental-insurance" params={params}>
          {t('application-new-adult:contact-information.next-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="primary" direction="previous" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:contact-information.prev-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

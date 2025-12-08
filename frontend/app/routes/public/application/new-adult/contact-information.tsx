import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
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
      communicationPreferences: state.communicationPreferences,
      email: state.email,
    },
    meta,
  };
}

export default function NewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { defaultState } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-adult', 'contact-information');

  const sections = [
    { id: 'phone-number', completed: defaultState.phoneNumber !== undefined },
    { id: 'address', completed: defaultState.mailingAddress !== undefined && defaultState.homeAddress !== undefined },
    { id: 'communication-preferences', completed: defaultState.communicationPreferences !== undefined },
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
          <CardTitle>{t('application-new-adult:contact-information.phone-number')}</CardTitle>
          <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.phoneNumber === undefined ? (
            <p>{t('application-new-adult:contact-information.phone-number-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:contact-information.phone-number')}>
                <p>{defaultState.phoneNumber.phoneNumber}</p>
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('phone-number') ? t('application-new-adult:contact-information.edit-phone-number') : t('application-new-adult:contact-information.add-phone-number')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-adult:contact-information.mailing-and-home-address')}</CardTitle>
          <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.mailingAddress === undefined && defaultState.homeAddress === undefined ? (
            <p>{t('application-new-adult:contact-information.address-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              {defaultState.mailingAddress !== undefined && (
                <DescriptionListItem term={t('application-new-adult:contact-information.mailing-address')}>
                  <Address
                    address={{
                      address: defaultState.mailingAddress.address,
                      city: defaultState.mailingAddress.city,
                      provinceState: defaultState.mailingAddress.province,
                      postalZipCode: defaultState.mailingAddress.postalCode,
                      country: defaultState.mailingAddress.country,
                    }}
                  />
                </DescriptionListItem>
              )}
              {defaultState.homeAddress !== undefined && (
                <DescriptionListItem term={t('application-new-adult:contact-information.home-address')}>
                  <Address
                    address={{
                      address: defaultState.homeAddress.address,
                      city: defaultState.homeAddress.city,
                      provinceState: defaultState.homeAddress.province,
                      postalZipCode: defaultState.homeAddress.postalCode,
                      country: defaultState.homeAddress.country,
                    }}
                  />
                </DescriptionListItem>
              )}
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/mailing-address" params={params} startIcon={completedSections.includes('address') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('address') ? t('application-new-adult:contact-information.edit-address') : t('application-new-adult:contact-information.add-address')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-adult:contact-information.communication-preferences')}</CardTitle>
          {completedSections.includes('communication-preferences') && <StatusTag status="complete" />}
        </CardHeader>
        <CardContent>
          {defaultState.communicationPreferences === undefined ? (
            <p>{t('application-new-adult:contact-information.communication-preferences-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:contact-information.preferred-language')}>
                <p>{t('application-new-adult:contact-information.preferred-language')}</p>
                {defaultState.communicationPreferences.preferredLanguage}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.preferred-method')}>
                <p>{t('application-new-adult:contact-information.preferred-method')}</p>
                {defaultState.communicationPreferences.preferredMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.preferred-notification-method')}>
                <p>{t('application-new-adult:contact-information.preferred-notification-method')}</p>
                {defaultState.communicationPreferences.preferredNotificationMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-new-adult:contact-information.email')}>
                <p>{t('application-new-adult:contact-information.email')}</p>
                {defaultState.email}
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink
            id="edit-button"
            variant="link"
            className="p-0"
            routeId="public/application/$id/new-adult/contact-information"
            params={params}
            startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus}
            size="lg"
          >
            {completedSections.includes('communication-preferences') ? t('application-new-adult:contact-information.edit-communication-preferences') : t('application-new-adult:contact-information.add-communication-preferences')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="secondary" direction="next" routeId="public/application/$id/new-adult/dental-insurance" params={params}>
          {t('application-new-adult:contact-information.next-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="primary" direction="previous" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:contact-information.prev-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

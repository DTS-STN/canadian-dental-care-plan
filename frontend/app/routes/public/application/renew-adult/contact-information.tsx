import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DescriptionListItem } from '~/components/description-list-item';
import { LoadingButton } from '~/components/loading-button';
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-renew-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewAdult.contactInformation,
  pageTitleI18nKey: 'application-renew-adult:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  // TODO: Update when renew-adult state is implemented
  const state = getPublicApplicationState({ params, session });
  // validateApplicationTypeAndFlow(state, params, ['renew-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-renew-adult:contact-information.page-title') }) };
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.province) : undefined;
  const countryMailing = state.mailingAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.country, locale) : undefined;
  const countryHome = state.homeAddress?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.country, locale) : undefined;

  const mailingAddressInfo = {
    address: state.mailingAddress?.address,
    city: state.mailingAddress?.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress?.postalCode,
    country: countryMailing?.name,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.address,
    city: state.homeAddress?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.postalCode,
    country: countryHome?.name,
  };

  return {
    defaultState: {
      phoneNumber: state.phoneNumber,
      communicationPreferences: state.communicationPreferences,
      email: state.email,
    },
    clientApplication: state.clientApplication,
    mailingAddressInfo,
    homeAddressInfo,
    meta,
  };
}

export default function RenewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, mailingAddressInfo, homeAddressInfo, clientApplication } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('renew-adult', 'contact-information');

  const sections = [
    { id: 'phone-number', completed: defaultState.phoneNumber?.hasChanged === true },
    { id: 'address', completed: mailingAddressInfo.address !== undefined && homeAddressInfo.address !== undefined },
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
          <CardTitle>{t('application-renew-adult:contact-information.phone-number')}</CardTitle>
          <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.phoneNumber?.value ? (
            <dl className="border-y">
              <DescriptionListItem term={t('application-renew-adult:contact-information.phone-number')}>
                <p>{defaultState.phoneNumber.value.primary}</p>
              </DescriptionListItem>
            </dl>
          ) : (
            <p>{t('application-renew-adult:contact-information.update-phone-number-help')}</p>
          )}
        </CardContent>
        {defaultState.phoneNumber?.value === undefined ? (
          <CardFooter className="divide-y border-t bg-zinc-100 px-0">
            <div className="w-full px-6">
              <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/phone-number" params={params} startIcon={faPenToSquare} size="lg">
                {t('application-renew-adult:contact-information.update-phone-number')}
              </ButtonLink>
            </div>
            <div className="w-full px-6">
              <LoadingButton id="complete-button" variant="link" name="_action" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                {t('application-renew-adult:contact-information.phone-number-unchanged')}
              </LoadingButton>
            </div>
          </CardFooter>
        ) : (
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('phone-number') ? t('application-renew-adult:contact-information.edit-phone-number') : t('application-renew-adult:contact-information.add-phone-number')}
            </ButtonLink>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-renew-adult:contact-information.mailing-and-home-address')}</CardTitle>
          <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {mailingAddressInfo.address === undefined && homeAddressInfo.address === undefined ? (
            <p>{t('application-renew-adult:contact-information.update-address-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              {mailingAddressInfo.address !== undefined && (
                <DescriptionListItem term={t('application-renew-adult:contact-information.mailing-address')}>
                  <Address
                    address={{
                      address: mailingAddressInfo.address,
                      city: mailingAddressInfo.city ?? '',
                      provinceState: mailingAddressInfo.province,
                      postalZipCode: mailingAddressInfo.postalCode,
                      country: mailingAddressInfo.country ?? '',
                    }}
                  />
                </DescriptionListItem>
              )}
              {homeAddressInfo.address !== undefined && (
                <DescriptionListItem term={t('application-renew-adult:contact-information.home-address')}>
                  <Address
                    address={{
                      address: homeAddressInfo.address,
                      city: homeAddressInfo.city ?? '',
                      provinceState: homeAddressInfo.province,
                      postalZipCode: homeAddressInfo.postalCode,
                      country: homeAddressInfo.country ?? '',
                    }}
                  />
                </DescriptionListItem>
              )}
            </dl>
          )}
        </CardContent>
        {clientApplication?.contactInformation.mailingAddress && clientApplication.contactInformation.homeAddress ? (
          <CardFooter className="divide-y border-t bg-zinc-100 px-0">
            <div className="w-full px-6">
              <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/mailing-address" params={params} startIcon={faPenToSquare} size="lg">
                {t('application-renew-adult:contact-information.update-address')}
              </ButtonLink>
            </div>
            <div className="w-full px-6">
              <LoadingButton id="complete-button" variant="link" className="p-0 pt-5" name="_action" startIcon={faCircleCheck} size="lg">
                {t('application-renew-adult:contact-information.address-unchanged')}
              </LoadingButton>
            </div>
          </CardFooter>
        ) : (
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/mailing-address" params={params} startIcon={completedSections.includes('address') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('address') ? t('application-renew-adult:contact-information.edit-address') : t('application-renew-adult:contact-information.add-address')}
            </ButtonLink>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-renew-adult:contact-information.communication-preferences')}</CardTitle>
          <CardAction>{completedSections.includes('communication-preferences') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.communicationPreferences === undefined ? (
            <p>{t('application-renew-adult:contact-information.update-communication-preferences-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-renew-adult:contact-information.preferred-language')}>
                <p>{t('application-renew-adult:contact-information.preferred-language')}</p>
                {defaultState.communicationPreferences.preferredLanguage}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-renew-adult:contact-information.preferred-method')}>
                <p>{t('application-renew-adult:contact-information.preferred-method')}</p>
                {defaultState.communicationPreferences.preferredMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-renew-adult:contact-information.preferred-notification-method')}>
                <p>{t('application-renew-adult:contact-information.preferred-notification-method')}</p>
                {defaultState.communicationPreferences.preferredNotificationMethod}
              </DescriptionListItem>
              <DescriptionListItem term={t('application-renew-adult:contact-information.email')}>
                <p>{t('application-renew-adult:contact-information.email')}</p>
                {defaultState.email}
              </DescriptionListItem>
            </dl>
          )}
        </CardContent>
        {clientApplication?.communicationPreferences ? (
          <CardFooter className="divide-y border-t bg-zinc-100 px-0">
            <div className="w-full px-6">
              <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/communication-preferences" params={params} startIcon={faPenToSquare} size="lg">
                {t('application-renew-adult:contact-information.update-communication-preferences')}
              </ButtonLink>
            </div>
            <div className="w-full px-6">
              <LoadingButton id="complete-button" variant="link" name="_action" className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                {t('application-renew-adult:contact-information.communication-preferences-unchanged')}
              </LoadingButton>
            </div>
          </CardFooter>
        ) : (
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/communication-preferences" params={params} startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('communication-preferences') ? t('application-renew-adult:contact-information.edit-communication-preferences') : t('application-renew-adult:contact-information.add-communication-preferences')}
            </ButtonLink>
          </CardFooter>
        )}
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/renew-adult/dental-insurance" params={params}>
          {t('application-renew-adult:contact-information.next-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
          {t('application-renew-adult:contact-information.prev-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

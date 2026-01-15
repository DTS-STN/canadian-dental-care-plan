import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFamilyState } from '~/.server/routes/helpers/public-application-family-route-helpers';
import { validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-family', 'gcweb'),
  pageIdentifier: pageIds.public.application.newFamily.contactInformation,
  pageTitleI18nKey: 'application-new-family:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFamilyState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['new-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-family:contact-information.page-title') }) };
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
    state: {
      phoneNumber: state.phoneNumber,
      communicationPreferences: state.communicationPreferences,
      email: state.email,
    },
    mailingAddressInfo,
    homeAddressInfo,
    preferredLanguage: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale) : undefined,
    preferredMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale) : undefined,
    preferredNotificationMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale) : undefined,
    meta,
  };
}

export default function NewFamilyContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-family', 'contact-information');

  const sections = [
    { id: 'phone-number', completed: state.phoneNumber?.hasChanged === true },
    { id: 'address', completed: mailingAddressInfo.address !== undefined && homeAddressInfo.address !== undefined },
    { id: 'communication-preferences', completed: state.communicationPreferences?.hasChanged === true },
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
          <CardTitle>{t('application-new-family:contact-information.phone-number')}</CardTitle>
          <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.phoneNumber?.hasChanged ? (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-family:contact-information.phone-number')}>
                <p>{state.phoneNumber.value.primary}</p>
              </DescriptionListItem>
            </dl>
          ) : (
            <p>{t('application-new-family:contact-information.phone-number-help')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('phone-number') ? t('application-new-family:contact-information.edit-phone-number') : t('application-new-family:contact-information.add-phone-number')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-family:contact-information.mailing-and-home-address')}</CardTitle>
          <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {mailingAddressInfo.address === undefined && homeAddressInfo.address === undefined ? (
            <p>{t('application-new-family:contact-information.address-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              {mailingAddressInfo.address !== undefined && (
                <DescriptionListItem term={t('application-new-family:contact-information.mailing-address')}>
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
                <DescriptionListItem term={t('application-new-family:contact-information.home-address')}>
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
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/mailing-address" params={params} startIcon={completedSections.includes('address') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('address') ? t('application-new-family:contact-information.edit-address') : t('application-new-family:contact-information.add-address')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-family:contact-information.communication-preferences')}</CardTitle>
          <CardAction>{completedSections.includes('communication-preferences') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.communicationPreferences?.hasChanged ? (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-family:contact-information.preferred-language')}>{preferredLanguage?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-family:contact-information.preferred-method')}>{preferredMethod?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-family:contact-information.preferred-notification-method')}>{preferredNotificationMethod?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-family:contact-information.email')}>{state.email}</DescriptionListItem>
            </dl>
          ) : (
            <p>{t('application-new-family:contact-information.communication-preferences-help')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/communication-preferences" params={params} startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('communication-preferences') ? t('application-new-family:contact-information.edit-communication-preferences') : t('application-new-family:contact-information.add-communication-preferences')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-family/dental-insurance" params={params}>
          {t('application-new-family:contact-information.next-btn')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/new-family/marital-status" params={params}>
          {t('application-new-family:contact-information.prev-btn')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

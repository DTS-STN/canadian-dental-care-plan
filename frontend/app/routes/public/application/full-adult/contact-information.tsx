import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullAdultState } from '~/.server/routes/helpers/public-application-full-adult-route-helpers';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.contactInformation,
  pageTitleI18nKey: 'application-full-adult:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-adult:contact-information.page-title') }) };
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = state.mailingAddress?.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale) : undefined;
  const countryHome = state.homeAddress?.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale) : undefined;
  const mailingAddressInfo = {
    address: state.mailingAddress?.value?.address,
    city: state.mailingAddress?.value?.city,
    province: mailingProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.mailingAddress?.value?.postalCode,
    country: countryMailing?.name,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.value?.address,
    city: state.homeAddress?.value?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.value?.postalCode,
    country: countryHome?.name,
  };

  return {
    state: {
      phoneNumber: state.phoneNumber,
      communicationPreferences: state.communicationPreferences,
      email: state.email,
    },
    preferredLanguage: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale) : undefined,
    preferredMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale) : undefined,
    preferredNotificationMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale) : undefined,
    mailingAddressInfo,
    homeAddressInfo,
    meta,
  };
}

export default function NewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const sections = [
    { id: 'phone-number', completed: state.phoneNumber?.hasChanged === true },
    { id: 'address', completed: mailingAddressInfo.address !== undefined && homeAddressInfo.address !== undefined },
    { id: 'communication-preferences', completed: state.communicationPreferences?.hasChanged === true },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).map((section) => section.id);
  const allSectionsCompleted = completedSections.length === sections.length;

  return (
    <>
      <ProgressStepper activeStep="contact-information" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('application:required-label')}</p>
          <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-adult:contact-information.phone-number')}</CardTitle>
            <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-adult:contact-information.phone-number')}>{state.phoneNumber.value.primary}</DefinitionListItem>
                {state.phoneNumber.value.alternate && <DefinitionListItem term={t('application-full-adult:contact-information.alt-phone-number')}>{state.phoneNumber.value.alternate}</DefinitionListItem>}
              </DefinitionList>
            ) : (
              <p>{t('application-full-adult:contact-information.phone-number-help')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('phone-number') ? t('application-full-adult:contact-information.edit-phone-number') : t('application-full-adult:contact-information.add-phone-number')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-adult:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo.address === undefined && homeAddressInfo.address === undefined ? (
              <p>{t('application-full-adult:contact-information.address-help')}</p>
            ) : (
              <DefinitionList layout="single-column">
                {mailingAddressInfo.address !== undefined && (
                  <DefinitionListItem term={t('application-full-adult:contact-information.mailing-address')}>
                    <Address
                      address={{
                        address: mailingAddressInfo.address,
                        city: mailingAddressInfo.city ?? '',
                        provinceState: mailingAddressInfo.province,
                        postalZipCode: mailingAddressInfo.postalCode,
                        country: mailingAddressInfo.country ?? '',
                      }}
                    />
                  </DefinitionListItem>
                )}
                {homeAddressInfo.address !== undefined && (
                  <DefinitionListItem term={t('application-full-adult:contact-information.home-address')}>
                    <Address
                      address={{
                        address: homeAddressInfo.address,
                        city: homeAddressInfo.city ?? '',
                        provinceState: homeAddressInfo.province,
                        postalZipCode: homeAddressInfo.postalCode,
                        country: homeAddressInfo.country ?? '',
                      }}
                    />
                  </DefinitionListItem>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/mailing-address" params={params} startIcon={completedSections.includes('address') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('address') ? t('application-full-adult:contact-information.edit-address') : t('application-full-adult:contact-information.add-address')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-adult:contact-information.communication-preferences')}</CardTitle>
            <CardAction>{completedSections.includes('communication-preferences') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-adult:contact-information.preferred-language')}>{preferredLanguage?.name}</DefinitionListItem>
                <DefinitionListItem term={t('application-full-adult:contact-information.preferred-method')}>{preferredMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t('application-full-adult:contact-information.preferred-notification-method')}>{preferredNotificationMethod?.name}</DefinitionListItem>
                {state.email && <DefinitionListItem term={t('application-full-adult:contact-information.email')}>{state.email}</DefinitionListItem>}
              </DefinitionList>
            ) : (
              <p>{t('application-full-adult:contact-information.communication-preferences-help')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/communication-preferences" params={params} startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus} size="lg">
              {completedSections.includes('communication-preferences') ? t('application-full-adult:contact-information.edit-communication-preferences') : t('application-full-adult:contact-information.add-communication-preferences')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/full-adult/dental-insurance" params={params}>
            {t('application-full-adult:contact-information.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/full-adult/marital-status" params={params}>
            {t('application-full-adult:contact-information.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

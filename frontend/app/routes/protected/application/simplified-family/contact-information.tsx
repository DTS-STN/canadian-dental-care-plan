import { data, useFetcher } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { loadProtectedApplicationSimplifiedFamilyState } from '~/.server/routes/helpers/protected-application-simplified-family-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/protected-application-simplified-section-checks';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { LoadingButton } from '~/components/loading-button';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/simplified-family/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  PHONE_NUMBER_NOT_CHANGED: 'phone-number-not-changed',
  ADDRESS_NOT_CHANGED: 'address-not-changed',
  COMMUNICATION_PREFERENCES_NOT_CHANGED: 'communication-preferences-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-simplified-family', 'gcweb'),
  pageIdentifier: pageIds.protected.application.simplifiedFamily.contactInformation,
  pageTitleI18nKey: 'protected-application-simplified-family:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-simplified-family:contact-information.page-title') }) };
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
    hasChanged: state.mailingAddress?.hasChanged,
  };

  const homeAddressInfo = {
    address: state.homeAddress?.value?.address,
    city: state.homeAddress?.value?.city,
    province: homeProvinceTerritoryStateAbbr?.abbr,
    postalCode: state.homeAddress?.value?.postalCode,
    country: countryHome?.name,
    hasChanged: state.homeAddress?.hasChanged,
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
    sections: {
      phoneNumber: { completed: isPhoneNumberSectionCompleted(state) },
      address: { completed: isAddressSectionCompleted(state) },
      communicationPreferences: { completed: isCommunicationPreferencesSectionCompleted(state) },
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.PHONE_NUMBER_NOT_CHANGED) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        phoneNumber: { hasChanged: false },
      },
    });
  }

  if (formAction === FORM_ACTION.ADDRESS_NOT_CHANGED) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        mailingAddress: { hasChanged: false },
        homeAddress: { hasChanged: false },
      },
    });
  }

  if (formAction === FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        communicationPreferences: {
          hasChanged: false,
        },
      },
    });
  }
  return data({ success: true }, { status: 200 });
}

export default function ProtectedRenewFamilyContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="contact-information" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:confirm-information')}</p>
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-simplified-family:contact-information.phone-number')}</CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber === undefined ? (
              <p>{t('protected-application-simplified-family:contact-information.phone-number-help')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-simplified-family:contact-information.phone-number')}>
                  {state.phoneNumber.hasChanged === false ? <p>{t('protected-application-simplified-family:contact-information.no-change')}</p> : <p>{state.phoneNumber.value.primary}</p>}
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          {state.phoneNumber ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-phone-button" variant="link" className="p-0" routeId="protected/application/$id/phone-number" params={params} startIcon={sections.phoneNumber.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.phoneNumber.completed ? t('protected-application-simplified-family:contact-information.edit-phone-number') : t('protected-application-simplified-family:contact-information.add-phone-number')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-phone-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/phone-number" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-simplified-family:contact-information.update-phone-number')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-phone-button" variant="link" name="_action" value={FORM_ACTION.PHONE_NUMBER_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-simplified-family:contact-information.phone-number-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-simplified-family:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo.hasChanged === undefined && homeAddressInfo.hasChanged === undefined ? (
              <p>{t('protected-application-simplified-family:contact-information.address-help')}</p>
            ) : (
              <>
                {mailingAddressInfo.hasChanged === false && homeAddressInfo.hasChanged === false ? (
                  <p>{t('protected-application-simplified-family:contact-information.no-change')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('protected-application-simplified-family:contact-information.mailing-address')}>
                      <Address
                        address={{
                          address: mailingAddressInfo.address ?? '',
                          city: mailingAddressInfo.city ?? '',
                          provinceState: mailingAddressInfo.province,
                          postalZipCode: mailingAddressInfo.postalCode,
                          country: mailingAddressInfo.country ?? '',
                        }}
                      />
                    </DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-simplified-family:contact-information.home-address')}>
                      <Address
                        address={{
                          address: homeAddressInfo.address ?? '',
                          city: homeAddressInfo.city ?? '',
                          provinceState: homeAddressInfo.province,
                          postalZipCode: homeAddressInfo.postalCode,
                          country: homeAddressInfo.country ?? '',
                        }}
                      />
                    </DefinitionListItem>
                  </DefinitionList>
                )}
              </>
            )}
          </CardContent>
          {mailingAddressInfo.hasChanged !== undefined && homeAddressInfo.hasChanged !== undefined ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-address-button" variant="link" className="p-0" routeId="protected/application/$id/mailing-address" params={params} startIcon={sections.address.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.address.completed ? t('protected-application-simplified-family:contact-information.edit-address') : t('protected-application-simplified-family:contact-information.add-address')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-address-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/mailing-address" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-simplified-family:contact-information.update-address')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-address-button" variant="link" className="p-0 pt-5" name="_action" value={FORM_ACTION.ADDRESS_NOT_CHANGED} startIcon={faCircleCheck} size="lg">
                  {t('protected-application-simplified-family:contact-information.address-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-simplified-family:contact-information.communication-preferences')}</CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences === undefined ? (
              <p>{t('protected-application-simplified-family:contact-information.communication-preferences-help')}</p>
            ) : (
              <>
                {state.communicationPreferences.hasChanged === false ? (
                  <p>{t('protected-application-simplified-family:contact-information.no-change')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('protected-application-simplified-family:contact-information.preferred-language')}>{preferredLanguage?.name}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-simplified-family:contact-information.preferred-method')}>{preferredMethod?.name}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-simplified-family:contact-information.preferred-notification-method')}>{preferredNotificationMethod?.name}</DefinitionListItem>
                    {state.email && <DefinitionListItem term={t('protected-application-simplified-family:contact-information.email')}>{state.email}</DefinitionListItem>}
                  </DefinitionList>
                )}
              </>
            )}
          </CardContent>
          {state.communicationPreferences ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-comms-button" variant="link" className="p-0" routeId="protected/application/$id/communication-preferences" params={params} startIcon={sections.communicationPreferences.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.communicationPreferences.completed ? t('protected-application-simplified-family:contact-information.edit-communication-preferences') : t('protected-application-simplified-family:contact-information.add-communication-preferences')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-comms-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/communication-preferences" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-simplified-family:contact-information.update-communication-preferences')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <LoadingButton id="complete-comms-button" variant="link" name="_action" value={FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-simplified-family:contact-information.communication-preferences-unchanged')}
                </LoadingButton>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="protected/application/$id/simplified-family/dental-insurance" params={params}>
            {t('protected-application-simplified-family:contact-information.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/type-of-application" params={params}>
            {t('protected-application-simplified-family:contact-information.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

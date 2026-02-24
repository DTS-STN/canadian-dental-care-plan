import type { JSX } from 'react';

import { data, useFetcher, useLoaderData, useParams } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationRenewalFamilyState } from '~/.server/routes/helpers/protected-application-renewal-family-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/protected-application-renewal-section-checks';
import { saveProtectedApplicationState, shouldSkipMaritalStatus, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/renewal-family/progress-stepper';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-renewal-family', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalFamily.contactInformation,
  pageTitleI18nKey: 'protected-application-renewal-family:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-family:contact-information.page-title') }) };
  const locale = getLocale(request);

  const countryService = appContainer.get(TYPES.CountryService);
  const languageService = appContainer.get(TYPES.LanguageService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);
  const sunLifeCommunicationMethodService = appContainer.get(TYPES.SunLifeCommunicationMethodService);
  const gcCommunicationMethodService = appContainer.get(TYPES.GCCommunicationMethodService);

  return {
    // Application state that is relevant to the contact information page.
    state: {
      email: state.email,
      phoneNumber: state.phoneNumber?.hasChanged
        ? {
            primary: state.phoneNumber.value.primary,
            alternate: state.phoneNumber.value.alternate,
          }
        : undefined,
      communicationPreferences: state.communicationPreferences?.hasChanged
        ? {
            preferredLanguage: languageService.getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale).name,
            preferredMethod: sunLifeCommunicationMethodService.getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale).name,
            preferredNotificationMethod: gcCommunicationMethodService.getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale).name,
          }
        : undefined,
      mailingAddress: state.mailingAddress?.hasChanged
        ? {
            address: state.mailingAddress.value.address,
            city: state.mailingAddress.value.city,
            province: state.mailingAddress.value.province //
              ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.mailingAddress.value.province)
              : undefined,
            postalCode: state.mailingAddress.value.postalCode,
            country: await countryService.getLocalizedCountryById(state.mailingAddress.value.country, locale),
          }
        : undefined,
      homeAddress: state.homeAddress?.hasChanged
        ? {
            address: state.homeAddress.value.address,
            city: state.homeAddress.value.city,
            province: state.homeAddress.value.province //
              ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.homeAddress.value.province)
              : undefined,
            postalCode: state.homeAddress.value.postalCode,
            country: await countryService.getLocalizedCountryById(state.homeAddress.value.country, locale),
          }
        : undefined,
    },
    // Existing client application data that is relevant to the contact information page.
    clientApplication: {
      email: state.clientApplication.contactInformation.email,
      emailVerified: state.clientApplication.contactInformation.emailVerified,
      phoneNumber: state.clientApplication.contactInformation.phoneNumber
        ? {
            primary: state.clientApplication.contactInformation.phoneNumber,
            alternate: state.clientApplication.contactInformation.phoneNumberAlt,
          }
        : undefined,
      communicationPreferences:
        state.clientApplication.communicationPreferences.preferredLanguage && state.clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada
          ? {
              preferredLanguage: languageService.getLocalizedLanguageById(state.clientApplication.communicationPreferences.preferredLanguage, locale).name,
              preferredMethod: sunLifeCommunicationMethodService.getLocalizedSunLifeCommunicationMethodById(state.clientApplication.communicationPreferences.preferredMethodSunLife, locale).name,
              preferredNotificationMethod: gcCommunicationMethodService.getLocalizedGCCommunicationMethodById(state.clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada, locale).name,
            }
          : undefined,
      mailingAddress: state.clientApplication.contactInformation.mailingCountry
        ? {
            address: state.clientApplication.contactInformation.mailingAddress,
            city: state.clientApplication.contactInformation.mailingCity,
            province: state.clientApplication.contactInformation.mailingProvince //
              ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.clientApplication.contactInformation.mailingProvince)
              : undefined,
            postalCode: state.clientApplication.contactInformation.mailingPostalCode,
            country: await countryService.getLocalizedCountryById(state.clientApplication.contactInformation.mailingCountry, locale),
            hasChanged: false,
          }
        : undefined,
      homeAddress: state.clientApplication.contactInformation.homeCountry
        ? {
            address: state.clientApplication.contactInformation.homeAddress,
            city: state.clientApplication.contactInformation.homeCity,
            province: state.clientApplication.contactInformation.homeProvince //
              ? await provinceTerritoryStateService.getProvinceTerritoryStateById(state.clientApplication.contactInformation.homeProvince)
              : undefined,
            postalCode: state.clientApplication.contactInformation.homePostalCode,
            country: await countryService.getLocalizedCountryById(state.clientApplication.contactInformation.homeCountry, locale),
            hasChanged: false,
          }
        : undefined,
    },
    shouldSkipMaritalStatusStep: shouldSkipMaritalStatus(state),
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

  const state = loadProtectedApplicationRenewalFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-family']);

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
  const { sections, shouldSkipMaritalStatusStep } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="contact-information" excludeMaritalStatus={shouldSkipMaritalStatusStep} className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
          <p>{t('protected-application:confirm-information')}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-family:contact-information.phone-number')}</CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <PhoneNumberCardContent />
          <PhoneNumberCardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-family:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <MailingAndHomeAddressCardContent />
          <MailingAndHomeAddressCardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-family:contact-information.communication-preferences')}</CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CommunicationPreferencesCardContent />
          <CommunicationPreferencesCardFooter />
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/renewal-family/dental-insurance"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Continue click"
          >
            {t('protected-application-renewal-family:contact-information.next-btn')}
          </NavigationButtonLink>
          {shouldSkipMaritalStatusStep ? (
            <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/renew" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Back click">
              {t('protected-application-renewal-family:contact-information.prev-btn.renew')}
            </NavigationButtonLink>
          ) : (
            <NavigationButtonLink
              variant="secondary"
              direction="previous"
              routeId="protected/application/$id/renewal-family/marital-status"
              params={params}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Back click"
            >
              {t('protected-application-renewal-family:contact-information.prev-btn.marital-status')}
            </NavigationButtonLink>
          )}
        </div>
      </div>
    </fetcher.Form>
  );
}

/**
 * This component determines what to show in the phone number card content based on whether the user has entered a new
 * phone number, whether there is an existing phone number on the client application, or if there is no phone number
 * at all. The logic is as follows:
 *
 * - If the user has entered a new phone number (state.phoneNumber is defined), show the new phone number.
 *
 * - If the user has not entered a new phone number but there is an existing phone number on the client application,
 *   show the existing phone number.
 *
 * - If there is no phone number on the client application and the user has not entered a new phone number, show the
 *   help text.
 *
 * This logic ensures that the user always sees a phone number if there is one available, whether it's the new one they
 * entered or the existing one on their application. If there is no phone number at all, it prompts them to add one.
 */
function PhoneNumberCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  if (state.phoneNumber) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.phone-number')}>{state.phoneNumber.primary}</DefinitionListItem>
          {state.phoneNumber.alternate && <DefinitionListItem term={t('protected-application-renewal-family:contact-information.alt-phone-number')}>{state.phoneNumber.alternate}</DefinitionListItem>}
        </DefinitionList>
      </CardContent>
    );
  }

  if (clientApplication.phoneNumber) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.phone-number')}>{clientApplication.phoneNumber.primary}</DefinitionListItem>
          {clientApplication.phoneNumber.alternate && <DefinitionListItem term={t('protected-application-renewal-family:contact-information.alt-phone-number')}>{clientApplication.phoneNumber.alternate}</DefinitionListItem>}
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-renewal-family:contact-information.phone-number-help')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the phone number card footer based on whether the user has entered a new
 * phone number or if there is an existing phone number on the client application. The logic is as follows:
 *
 * - If the user has entered a new phone number (state.phoneNumber is defined), show the "Edit phone number" button.
 *
 * - If the user has not entered a new phone number but there is an existing phone number on the client application,
 *   show both the "Update phone number" button and the "Phone number unchanged" button. This allows the user to either
 *   go update their phone number or confirm that their existing phone number is still correct.
 *
 * - If there is no phone number on the client application and the user has not entered a new phone number, show the
 *   "Add phone number" button.
 *
 * This logic ensures that the user always has a clear call to action based on their current state. If they have made
 * a change, they can edit it. If they haven't made a change but have an existing phone number, they can either update
 * it or confirm it's unchanged. If they don't have a phone number at all, they are prompted to add one.
 *
 * @returns
 */
function PhoneNumberCardFooter(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication, sections } = useLoaderData<typeof loader>();
  const params = useParams();

  if (state.phoneNumber || sections.phoneNumber.completed) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id="edit-phone-button"
          variant="link"
          className="p-0"
          routeId="protected/application/$id/phone-number"
          params={params}
          startIcon={faPenToSquare}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Edit phone click"
        >
          {t('protected-application-renewal-family:contact-information.edit-phone-number')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.phoneNumber) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-phone-button"
            variant="link"
            className="p-0 pb-5"
            routeId="protected/application/$id/phone-number"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Update phone click"
          >
            {t('protected-application-renewal-family:contact-information.update-phone-number')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-phone-button"
            variant="link"
            name="_action"
            value={FORM_ACTION.PHONE_NUMBER_NOT_CHANGED}
            className="p-0 pt-5"
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Complete phone click"
          >
            {t('protected-application-renewal-family:contact-information.phone-number-unchanged')}
          </Button>
        </div>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id="add-phone-button"
        variant="link"
        className="p-0"
        routeId="protected/application/$id/phone-number"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Add phone click"
      >
        {t('protected-application-renewal-family:contact-information.add-phone-number')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the mailing and home address card content based on whether the user has
 * entered a new mailing and home address, whether there is an existing mailing and home address on the client
 * application, or if there is no mailing and home address at all. The logic is as follows:
 *
 * - If the user has entered a new mailing and home address (state.mailingAddress and state.homeAddress are defined),
 *   show the new mailing and home address.
 *
 * - If the user has not entered a new mailing and home address but there is an existing mailing and home address on
 *   the client application, show the existing mailing and home address.
 *
 * - If there is no mailing and home address on the client application and the user has not entered a new mailing and
 *   home address, show the help text.
 *
 * This logic ensures that the user always sees a mailing and home address if there is one available, whether it's the
 * new one they entered or the existing one on their application. If there is no mailing and home address at all, it
 * prompts them to add one.
 */
function MailingAndHomeAddressCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  if (state.mailingAddress && state.homeAddress) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.mailing-address')}>
            <Address
              address={{
                address: state.mailingAddress.address,
                city: state.mailingAddress.city,
                provinceState: state.mailingAddress.province?.abbr,
                postalZipCode: state.mailingAddress.postalCode,
                country: state.mailingAddress.country.name,
              }}
            />
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.home-address')}>
            <Address
              address={{
                address: state.homeAddress.address,
                city: state.homeAddress.city,
                provinceState: state.homeAddress.province?.abbr,
                postalZipCode: state.homeAddress.postalCode,
                country: state.homeAddress.country.name,
              }}
            />
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  if (clientApplication.mailingAddress && clientApplication.homeAddress) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.mailing-address')}>
            <Address
              address={{
                address: clientApplication.mailingAddress.address,
                city: clientApplication.mailingAddress.city,
                provinceState: clientApplication.mailingAddress.province?.abbr,
                postalZipCode: clientApplication.mailingAddress.postalCode,
                country: clientApplication.mailingAddress.country.name,
              }}
            />
          </DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.home-address')}>
            <Address
              address={{
                address: clientApplication.homeAddress.address ?? '',
                city: clientApplication.homeAddress.city ?? '',
                provinceState: clientApplication.homeAddress.province?.abbr,
                postalZipCode: clientApplication.homeAddress.postalCode,
                country: clientApplication.homeAddress.country.name,
              }}
            />
          </DefinitionListItem>
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-renewal-family:contact-information.address-help')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the mailing and home address card footer based on whether the user has
 * entered a new mailing and home address or if there is an existing mailing and home address on the client
 * application. The logic is as follows:
 *
 * - If the user has entered a new mailing and home address (state.mailingAddress and state.homeAddress are defined),
 *   show the "Edit address" button.
 *
 * - If the user has not entered a new mailing and home address but there is an existing mailing and home address on
 *   the client application, show both the "Update address" button and the "Address unchanged" button. This allows the
 *   user to either go update their mailing and home address or confirm that their existing mailing and home address
 *   is still correct.
 *
 * - If there is no mailing and home address on the client application and the user has not entered a new mailing and
 *   home address, show the "Add address" button.
 *
 * This logic ensures that the user always has a clear call to action based on their current state. If they have made
 * a change, they can edit it. If they haven't made a change but have an existing mailing and home address, they can
 * either update it or confirm it's unchanged. If they don't have a mailing and home address at all, they are prompted
 * to add one.
 */
function MailingAndHomeAddressCardFooter(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication, sections } = useLoaderData<typeof loader>();
  const params = useParams();

  if ((state.mailingAddress && state.homeAddress) || sections.address.completed) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id="edit-address-button"
          variant="link"
          className="p-0"
          routeId="protected/application/$id/mailing-address"
          params={params}
          startIcon={faPenToSquare}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Edit address click"
        >
          {t('protected-application-renewal-family:contact-information.edit-address')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.mailingAddress && clientApplication.homeAddress) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-address-button"
            variant="link"
            className="p-0 pb-5"
            routeId="protected/application/$id/mailing-address"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Update address click"
          >
            {t('protected-application-renewal-family:contact-information.update-address')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-address-button"
            variant="link"
            className="p-0 pt-5"
            name="_action"
            value={FORM_ACTION.ADDRESS_NOT_CHANGED}
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Complete address click"
          >
            {t('protected-application-renewal-family:contact-information.address-unchanged')}
          </Button>
        </div>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id="add-address-button"
        variant="link"
        className="p-0"
        routeId="protected/application/$id/mailing-address"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Add address click"
      >
        {t('protected-application-renewal-family:contact-information.add-address')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the communication preferences card content based on whether the user has
 * entered new communication preferences, whether there are existing communication preferences on the client
 * application, or if there are no communication preferences at all. The logic is as follows:
 *
 * - If the user has entered new communication preferences (state.communicationPreferences is defined), show the new
 *   communication preferences.
 *
 * - If the user has not entered new communication preferences but there are existing communication preferences on the
 *   client application, show the existing communication preferences.
 *
 * - If there are no communication preferences on the client application and the user has not entered new
 *   communication preferences, show the help text.
 *
 * This logic ensures that the user always sees communication preferences if there are any available, whether it's the
 * new ones they entered or the existing ones on their application. If there are no communication preferences at all,
 * it prompts them to add them.
 */
function CommunicationPreferencesCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  if (state.communicationPreferences) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-language')}>{state.communicationPreferences.preferredLanguage}</DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-method')}>{state.communicationPreferences.preferredMethod}</DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-notification-method')}>{state.communicationPreferences.preferredNotificationMethod}</DefinitionListItem>
          {state.email && <DefinitionListItem term={t('protected-application-renewal-family:contact-information.email')}>{state.email}</DefinitionListItem>}
        </DefinitionList>
      </CardContent>
    );
  }

  if (clientApplication.communicationPreferences) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-language')}>{clientApplication.communicationPreferences.preferredLanguage}</DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-method')}>{clientApplication.communicationPreferences.preferredMethod}</DefinitionListItem>
          <DefinitionListItem term={t('protected-application-renewal-family:contact-information.preferred-notification-method')}>{clientApplication.communicationPreferences.preferredNotificationMethod}</DefinitionListItem>
          {clientApplication.email && <DefinitionListItem term={t('protected-application-renewal-family:contact-information.email')}>{clientApplication.email}</DefinitionListItem>}
        </DefinitionList>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('protected-application-renewal-family:contact-information.communication-preferences-help')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the communication preferences card footer based on whether the user has
 * entered new communication preferences or if there are existing communication preferences on the client
 * application. The logic is as follows:
 *
 * - If the user has entered new communication preferences (state.communicationPreferences is defined), show the "Edit
 *   communication preferences" button.
 *
 * - If the user has not entered new communication preferences but there are existing communication preferences on the
 *   client application, show both the "Update communication preferences" button and the "Communication preferences
 *   unchanged" button. This allows the user to either go update their communication preferences or confirm that their
 *   existing communication preferences are still correct.
 *
 * - If there are no communication preferences on the client application and the user has not entered new
 *   communication preferences, show the "Add communication preferences" button.
 *
 * This logic ensures that the user always has a clear call to action based on their current state. If they have made a
 * change, they can edit it. If they haven't made a change but have existing communication preferences, they can either
 * update it or confirm it's unchanged. If they don't have communication preferences at all, they are prompted to add them.
 */
function CommunicationPreferencesCardFooter(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication, sections } = useLoaderData<typeof loader>();
  const params = useParams();

  if (state.communicationPreferences || sections.communicationPreferences.completed) {
    return (
      <CardFooter className="border-t bg-zinc-100">
        <ButtonLink
          id="edit-comms-button"
          variant="link"
          className="p-0"
          routeId="protected/application/$id/communication-preferences"
          params={params}
          startIcon={faPenToSquare}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Edit comms click"
        >
          {t('protected-application-renewal-family:contact-information.edit-communication-preferences')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.communicationPreferences) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-comms-button"
            variant="link"
            className="p-0 pb-5"
            routeId="protected/application/$id/communication-preferences"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Update comms click"
          >
            {t('protected-application-renewal-family:contact-information.update-communication-preferences')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-comms-button"
            variant="link"
            name="_action"
            value={FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED}
            className="p-0 pt-5"
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Complete comms click"
          >
            {t('protected-application-renewal-family:contact-information.communication-preferences-unchanged')}
          </Button>
        </div>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-zinc-100">
      <ButtonLink
        id="add-comms-button"
        variant="link"
        className="p-0"
        routeId="protected/application/$id/communication-preferences"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Add comms click"
      >
        {t('protected-application-renewal-family:contact-information.add-communication-preferences')}
      </ButtonLink>
    </CardFooter>
  );
}

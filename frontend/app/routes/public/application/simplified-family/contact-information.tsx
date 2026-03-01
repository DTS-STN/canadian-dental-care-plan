import type { JSX } from 'react';

import { data, useFetcher, useLoaderData, useParams } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicApplicationSimplifiedFamilyState } from '~/.server/routes/helpers/public-application-simplified-family-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/public-application-simplified-section-checks';
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
import { ProgressStepper } from '~/routes/public/application/simplified-family/progress-stepper';
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-simplified-family', 'gcweb'),
  pageIdentifier: pageIds.public.application.simplifiedFamily.contactInformation,
  pageTitleI18nKey: 'application-simplified-family:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-simplified-family:contact-information.page-title') }) };
  const locale = getLocale(request);

  const mailingProvinceTerritoryStateAbbr = state.mailingAddress?.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province) : undefined;
  const homeProvinceTerritoryStateAbbr = state.homeAddress?.value?.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province) : undefined;
  const countryMailing = state.mailingAddress?.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale) : undefined;
  const countryHome = state.homeAddress?.value?.country ? await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale) : undefined;
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  return {
    state: {
      email: state.email,
      phoneNumber: state.phoneNumber
        ? {
            hasChanged: state.phoneNumber.hasChanged,
            primary: state.phoneNumber.value?.primary,
          }
        : undefined,
      communicationPreferences: state.communicationPreferences
        ? {
            hasChanged: state.communicationPreferences.hasChanged,
            preferredLanguage: state.communicationPreferences.hasChanged ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale).name : undefined,
            preferredMethod: state.communicationPreferences.hasChanged ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale).name : undefined,
            preferredNotificationMethod: state.communicationPreferences.hasChanged
              ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale).name
              : undefined,
          }
        : undefined,
      mailingAddress: state.mailingAddress
        ? {
            hasChanged: state.mailingAddress.hasChanged,
            address: state.mailingAddress.value?.address,
            city: state.mailingAddress.value?.city,
            province: mailingProvinceTerritoryStateAbbr?.abbr,
            postalCode: state.mailingAddress.value?.postalCode,
            country: countryMailing?.name,
          }
        : undefined,
      homeAddress: state.homeAddress
        ? {
            hasChanged: state.homeAddress.hasChanged,
            address: state.homeAddress.value?.address,
            city: state.homeAddress.value?.city,
            province: homeProvinceTerritoryStateAbbr?.abbr,
            postalCode: state.homeAddress.value?.postalCode,
            country: countryHome?.name,
          }
        : undefined,
    },
    clientApplication: {
      email: state.clientApplication?.contactInformation.email,
      emailVerified: state.clientApplication?.contactInformation.emailVerified,
      hasPhoneNumber: !!state.clientApplication?.contactInformation.phoneNumber,
      hasCommunicationPreferences:
        state.clientApplication?.communicationPreferences.preferredMethodSunLife === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID && state.clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada === COMMUNICATION_METHOD_GC_DIGITAL_ID,
      hasMailingAddress: !!state.clientApplication?.contactInformation.mailingCountry,
      hasHomeAddress: !!state.clientApplication?.contactInformation.homeCountry,
    },
    sections: {
      phoneNumber: { completed: isPhoneNumberSectionCompleted(state) },
      address: { completed: isAddressSectionCompleted(state) },
      communicationPreferences: { completed: isCommunicationPreferencesSectionCompleted(state) },
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicApplicationSimplifiedFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.PHONE_NUMBER_NOT_CHANGED) {
    savePublicApplicationState({
      params,
      session,
      state: {
        phoneNumber: { hasChanged: false },
      },
    });
  }

  if (formAction === FORM_ACTION.ADDRESS_NOT_CHANGED) {
    savePublicApplicationState({
      params,
      session,
      state: {
        mailingAddress: { hasChanged: false },
        homeAddress: { hasChanged: false },
      },
    });
  }

  if (formAction === FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED) {
    savePublicApplicationState({
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

export default function RenewFamilyContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="contact-information" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('application:confirm-information')}</p>
          <p>{t('application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-family:contact-information.phone-number')}</CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <PhoneNumberCardContent />
          <PhoneNumberCardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-family:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <MailingAndHomeAddressCardContent />
          <MailingAndHomeAddressCardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-family:contact-information.communication-preferences')}</CardTitle>
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
            routeId="public/application/$id/simplified-family/dental-insurance"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Continue click"
          >
            {t('application-simplified-family:contact-information.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Back click">
            {t('application-simplified-family:contact-information.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

/**
 * This component determines what to show in the phone number card content based on whether the user has entered a new
 * phone number, confirmed no changes, or if there is no phone number at all. The logic is as follows:
 *
 * - If the user has entered a new phone number (state.phoneNumber is defined with hasChanged true), show the new phone number.
 *
 * - If the user has confirmed no changes (state.phoneNumber is defined with hasChanged false), show "No update" text.
 *
 * - If the user has not entered a new phone number but there is an existing phone number on the client application,
 *   show the update help text ("Would you like to update your phone number?").
 *
 * - If there is no phone number on the client application and the user has not entered a new phone number, show the
 *   help text ("Enter your phone number.").
 *
 * This logic ensures that the user never sees the existing client application values directly. Instead, they are
 * prompted to either add a phone number (if none exists) or update their existing phone number (if one exists).
 */
function PhoneNumberCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  if (state.phoneNumber) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          {!state.phoneNumber.hasChanged && <p>{t('application-simplified-family:contact-information.no-change')}</p>}
          {state.phoneNumber.hasChanged && <DefinitionListItem term={t('application-simplified-family:contact-information.phone-number')}>{state.phoneNumber.primary}</DefinitionListItem>}
        </DefinitionList>
      </CardContent>
    );
  }

  if (clientApplication.hasPhoneNumber) {
    return (
      <CardContent>
        <p>{t('application-simplified-family:contact-information.update-phone-number-help')}</p>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <p>{t('application-simplified-family:contact-information.phone-number-help')}</p>
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
          routeId="public/application/$id/phone-number"
          params={params}
          startIcon={sections.phoneNumber.completed ? faPenToSquare : faCirclePlus}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Edit phone click"
        >
          {sections.phoneNumber.completed ? t('application-simplified-family:contact-information.edit-phone-number') : t('application-simplified-family:contact-information.add-phone-number')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.hasPhoneNumber) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-phone-button"
            variant="link"
            className="mb-5 p-0"
            routeId="public/application/$id/phone-number"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Update phone click"
          >
            {t('application-simplified-family:contact-information.update-phone-number')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-phone-button"
            variant="link"
            name="_action"
            value={FORM_ACTION.PHONE_NUMBER_NOT_CHANGED}
            className="mt-5 p-0"
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Complete phone click"
          >
            {t('application-simplified-family:contact-information.phone-number-unchanged')}
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
        routeId="public/application/$id/phone-number"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Add phone click"
      >
        {t('application-simplified-family:contact-information.add-phone-number')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the mailing and home address card content based on whether the user has
 * entered new addresses, confirmed no changes, or if there are no addresses at all. The logic is as follows:
 *
 * - If the user has entered new addresses (state.mailingAddress and state.homeAddress are defined with hasChanged true),
 *   show the new addresses.
 *
 * - If the user has confirmed no changes (state.mailingAddress and state.homeAddress are defined with hasChanged false),
 *   show "No update" text.
 *
 * - If the user has not entered new addresses but there are existing addresses on the client application, show the
 *   update help text ("Would you like to update your mailing and home address?").
 *
 * - If there are no addresses on the client application and the user has not entered new addresses, show the help
 *   text ("Enter your mailing and home address.").
 *
 * This logic ensures that the user never sees the existing client application values directly. Instead, they are
 * prompted to either add addresses (if none exist) or update their existing addresses (if they exist).
 */
function MailingAndHomeAddressCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  // Case 1: User has state for addresses
  if (state.mailingAddress && state.homeAddress) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          {/* Check if both addresses have no changes */}
          {!state.mailingAddress.hasChanged && !state.homeAddress.hasChanged && <p>{t('application-simplified-family:contact-information.no-change')}</p>}

          {/* Show mailing address if it has changes */}
          {state.mailingAddress.hasChanged && (
            <DefinitionListItem term={t('application-simplified-family:contact-information.mailing-address')}>
              <Address
                address={{
                  address: state.mailingAddress.address ?? '',
                  city: state.mailingAddress.city ?? '',
                  provinceState: state.mailingAddress.province,
                  postalZipCode: state.mailingAddress.postalCode,
                  country: state.mailingAddress.country ?? '',
                }}
              />
            </DefinitionListItem>
          )}

          {/* Show home address if it has changes */}
          {state.homeAddress.hasChanged && (
            <DefinitionListItem term={t('application-simplified-family:contact-information.home-address')}>
              <Address
                address={{
                  address: state.homeAddress.address ?? '',
                  city: state.homeAddress.city ?? '',
                  provinceState: state.homeAddress.province,
                  postalZipCode: state.homeAddress.postalCode,
                  country: state.homeAddress.country ?? '',
                }}
              />
            </DefinitionListItem>
          )}
        </DefinitionList>
      </CardContent>
    );
  }

  // Case 2: No state changes but client has data
  if (clientApplication.hasMailingAddress && clientApplication.hasHomeAddress) {
    return (
      <CardContent>
        <p>{t('application-simplified-family:contact-information.update-address-help')}</p>
      </CardContent>
    );
  }

  // Case 3: No data at all
  return (
    <CardContent>
      <p>{t('application-simplified-family:contact-information.address-help')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the mailing and home address card footer based on whether the user has
 * entered new addresses or if there are existing addresses on the client application. The logic is as follows:
 *
 * - If the user has entered new addresses (state.mailingAddress and state.homeAddress are defined), show the "Edit
 *   address" button.
 *
 * - If the user has not entered new addresses but there are existing addresses on the client application, show both
 *   the "Update address" button and the "Address unchanged" button. This allows the user to either go update their
 *   addresses or confirm that their existing addresses are still correct.
 *
 * - If there are no addresses on the client application and the user has not entered new addresses, show the "Add
 *   address" button.
 *
 * This logic ensures that the user always has a clear call to action based on their current state. If they have made
 * a change, they can edit it. If they haven't made a change but have existing addresses, they can either update them
 * or confirm they're unchanged. If they don't have addresses at all, they are prompted to add them.
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
          routeId="public/application/$id/mailing-address"
          params={params}
          startIcon={sections.address.completed ? faPenToSquare : faCirclePlus}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Edit address click"
        >
          {sections.address.completed ? t('application-simplified-family:contact-information.edit-address') : t('application-simplified-family:contact-information.add-address')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.hasMailingAddress && clientApplication.hasHomeAddress) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-address-button"
            variant="link"
            className="mb-5 p-0"
            routeId="public/application/$id/mailing-address"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Update address click"
          >
            {t('application-simplified-family:contact-information.update-address')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <Button
            id="complete-address-button"
            variant="link"
            className="mt-5 p-0"
            name="_action"
            value={FORM_ACTION.ADDRESS_NOT_CHANGED}
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Complete address click"
          >
            {t('application-simplified-family:contact-information.address-unchanged')}
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
        routeId="public/application/$id/mailing-address"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Add address click"
      >
        {t('application-simplified-family:contact-information.add-address')}
      </ButtonLink>
    </CardFooter>
  );
}

/**
 * This component determines what to show in the communication preferences card content based on whether the user has
 * entered new preferences, confirmed no changes, or if there are no preferences at all. The logic is as follows:
 *
 * - If the user has entered new communication preferences (state.communicationPreferences is defined with hasChanged true),
 *   show the new preferences.
 *
 * - If the user has confirmed no changes (state.communicationPreferences is defined with hasChanged false), show "No update" text.
 *
 * - If the user has not entered new communication preferences but there are existing preferences on the client
 *   application, show the update help text ("Would you like to update your communication preferences?").
 *
 * - If there are no communication preferences on the client application and the user has not entered new preferences,
 *   show the help text ("Select your communication preferences.").
 *
 * This logic ensures that the user never sees the existing client application values directly. Instead, they are
 * prompted to either add preferences (if none exist) or update their existing preferences (if they exist).
 */
function CommunicationPreferencesCardContent(): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, clientApplication } = useLoaderData<typeof loader>();

  // Case 1: User has state for communication preferences
  if (state.communicationPreferences) {
    return (
      <CardContent>
        <DefinitionList layout="single-column">
          {/* Check if communication preferences have no changes */}
          {!state.communicationPreferences.hasChanged && <p>{t('application-simplified-family:contact-information.no-change')}</p>}

          {/* Show preferences if they have changes */}
          {state.communicationPreferences.hasChanged && (
            <>
              <DefinitionListItem term={t('application-simplified-family:contact-information.preferred-language')}>{state.communicationPreferences.preferredLanguage}</DefinitionListItem>
              <DefinitionListItem term={t('application-simplified-family:contact-information.preferred-method')}>{state.communicationPreferences.preferredMethod}</DefinitionListItem>
              <DefinitionListItem term={t('application-simplified-family:contact-information.preferred-notification-method')}>{state.communicationPreferences.preferredNotificationMethod}</DefinitionListItem>
              {state.email && <DefinitionListItem term={t('application-simplified-family:contact-information.email')}>{state.email}</DefinitionListItem>}
            </>
          )}
        </DefinitionList>
      </CardContent>
    );
  }

  // Case 2: No state changes but client has data
  if (clientApplication.hasCommunicationPreferences) {
    return (
      <CardContent>
        <p>{t('application-simplified-family:contact-information.update-communication-preferences-help')}</p>
      </CardContent>
    );
  }

  // Case 3: No data at all
  return (
    <CardContent>
      <p>{t('application-simplified-family:contact-information.communication-preferences-help')}</p>
    </CardContent>
  );
}

/**
 * This component determines what to show in the communication preferences card footer based on whether the user has
 * entered new preferences or if there are existing preferences on the client application. The logic is as follows:
 *
 * - If the user has entered new communication preferences (state.communicationPreferences is defined), show the "Edit
 *   communication preferences" button.
 *
 * - If the user has not entered new communication preferences but there are existing preferences on the client
 *   application, show both the "Update communication preferences" button and the "Communication preferences unchanged"
 *   button. This allows the user to either go update their preferences or confirm that their existing preferences are
 *   still correct.
 *
 * - If there are no communication preferences on the client application and the user has not entered new preferences,
 *   show the "Add communication preferences" button.
 *
 * This logic ensures that the user always has a clear call to action based on their current state. If they have made
 * a change, they can edit it. If they haven't made a change but have existing preferences, they can either update them
 * or confirm they're unchanged. If they don't have preferences at all, they are prompted to add them.
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
          routeId="public/application/$id/communication-preferences"
          params={params}
          startIcon={sections.communicationPreferences.completed ? faPenToSquare : faCirclePlus}
          size="lg"
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Edit comms click"
        >
          {sections.communicationPreferences.completed ? t('application-simplified-family:contact-information.edit-communication-preferences') : t('application-simplified-family:contact-information.add-communication-preferences')}
        </ButtonLink>
      </CardFooter>
    );
  }

  if (clientApplication.hasCommunicationPreferences) {
    return (
      <CardFooter className="divide-y border-t bg-zinc-100 px-0">
        <div className="w-full px-6">
          <ButtonLink
            id="update-comms-button"
            variant="link"
            className="mb-5 p-0"
            routeId="public/application/$id/communication-preferences"
            params={params}
            startIcon={faPenToSquare}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Update comms click"
          >
            {t('application-simplified-family:contact-information.update-communication-preferences')}
          </ButtonLink>
        </div>
        <div className="w-full px-6">
          <LoadingButton
            id="complete-comms-button"
            variant="link"
            name="_action"
            value={FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED}
            className="mt-5 p-0"
            startIcon={faCircleCheck}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Complete comms click"
          >
            {t('application-simplified-family:contact-information.communication-preferences-unchanged')}
          </LoadingButton>
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
        routeId="public/application/$id/communication-preferences"
        params={params}
        startIcon={faCirclePlus}
        size="lg"
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Family:Add comms click"
      >
        {t('application-simplified-family:contact-information.add-communication-preferences')}
      </ButtonLink>
    </CardFooter>
  );
}

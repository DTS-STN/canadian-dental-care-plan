import { data, useFetcher } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationFullAdultState } from '~/.server/routes/helpers/protected-application-full-adult-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isEmailSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/protected-application-full-section-checks';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
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
import { ProgressStepper } from '~/routes/protected/application/full-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  PHONE_NUMBER_NOT_CHANGED: 'phone-number-not-changed',
  ADDRESS_NOT_CHANGED: 'address-not-changed',
  COMMUNICATION_PREFERENCES_NOT_CHANGED: 'communication-preferences-not-changed',
  EMAIL_ADDRESS_NOT_CHANGED: 'email-address-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.protected.application.fullAdult.contactInformation,
  pageTitleI18nKey: 'protected-application-full-adult:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-full-adult:contact-information.page-title') }) };
  const locale = getLocale(request);

  const mailingAddressInfo = state.mailingAddress?.value?.country
    ? {
        address: state.mailingAddress.value.address,
        city: state.mailingAddress.value.city,
        province: state.mailingAddress.value.province ? (await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.mailingAddress.value.province)).abbr : undefined, //eslint-disable-line unicorn/no-await-expression-member
        postalCode: state.mailingAddress.value.postalCode,
        country: state.mailingAddress.value.country ? (await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale)).name : undefined, //eslint-disable-line unicorn/no-await-expression-member
        hasChanged: state.mailingAddress.hasChanged,
      }
    : state.clientApplication?.contactInformation.mailingCountry //eslint-disable-line unicorn/no-nested-ternary
      ? {
          address: state.clientApplication.contactInformation.mailingAddress,
          city: state.clientApplication.contactInformation.mailingCity,
          province: state.clientApplication.contactInformation.mailingProvince ? (await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.clientApplication.contactInformation.mailingProvince)).abbr : undefined, //eslint-disable-line unicorn/no-await-expression-member
          postalCode: state.clientApplication.contactInformation.mailingPostalCode,
          country: state.clientApplication.contactInformation.mailingCountry ? (await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.clientApplication.contactInformation.mailingCountry, locale)).name : undefined, //eslint-disable-line unicorn/no-await-expression-member
          hasChanged: false,
        }
      : undefined;

  const homeAddressInfo = state.homeAddress?.value?.country
    ? {
        address: state.homeAddress.value.address,
        city: state.homeAddress.value.city,
        province: state.homeAddress.value.province ? (await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.homeAddress.value.province)).abbr : undefined, //eslint-disable-line unicorn/no-await-expression-member
        postalCode: state.homeAddress.value.postalCode,
        country: state.homeAddress.value.country ? (await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale)).name : undefined, //eslint-disable-line unicorn/no-await-expression-member
        hasChanged: state.homeAddress.hasChanged,
      }
    : state.clientApplication?.contactInformation.homeCountry //eslint-disable-line unicorn/no-nested-ternary
      ? {
          address: state.clientApplication.contactInformation.homeAddress,
          city: state.clientApplication.contactInformation.homeCity,
          province: state.clientApplication.contactInformation.homeProvince ? (await appContainer.get(TYPES.ProvinceTerritoryStateService).getProvinceTerritoryStateById(state.clientApplication.contactInformation.homeProvince)).abbr : undefined, //eslint-disable-line unicorn/no-await-expression-member
          postalCode: state.clientApplication.contactInformation.homePostalCode,
          country: state.clientApplication.contactInformation.homeCountry ? (await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.clientApplication.contactInformation.homeCountry, locale)).name : undefined, //eslint-disable-line unicorn/no-await-expression-member
          hasChanged: false,
        }
      : undefined;

  const preferredLanguageId = state.communicationPreferences?.value?.preferredLanguage ?? state.clientApplication?.communicationPreferences.preferredLanguage;
  const preferredMethodId = state.communicationPreferences?.value?.preferredMethod ?? state.clientApplication?.communicationPreferences.preferredMethodSunLife;

  const defaultDisplayValues = {
    phoneNumber: state.phoneNumber?.value?.primary ?? state.clientApplication?.contactInformation.phoneNumber,
    preferredLanguage: preferredLanguageId ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(preferredLanguageId, locale).name : undefined,
    preferredMethod: preferredMethodId ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(preferredMethodId, locale).name : undefined,
    email: state.email ?? state.clientApplication?.contactInformation.email,
    mailingAddressInfo,
    homeAddressInfo,
  };

  return {
    state: {
      phoneNumber: state.phoneNumber,
      communicationPreferences: state.communicationPreferences,
      mailingAddress: state.mailingAddress,
      homeAddress: state.homeAddress,
      email: state.email,
    },
    defaultDisplayValues,
    sections: {
      phoneNumber: { completed: isPhoneNumberSectionCompleted(state) },
      address: { completed: isAddressSectionCompleted(state) },
      communicationPreferences: { completed: isCommunicationPreferencesSectionCompleted(state) },
      email: { completed: isEmailSectionCompleted(state) },
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

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

  // TODO: make email of type DeclaredChange (likely)
  if (formAction === FORM_ACTION.EMAIL_ADDRESS_NOT_CHANGED) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        email: state.clientApplication?.contactInformation.email,
        emailVerified: state.clientApplication?.contactInformation.emailVerified,
      },
    });
  }

  return data({ success: true }, { status: 200 });
}

export default function ProtectedRenewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { state, defaultDisplayValues, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <ProgressStepper activeStep="contact-information" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:required-label')}</p>
          <p>{completedSectionsLabel}</p>
          <p>{t('protected-application:confirm-information')}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-full-adult:contact-information.phone-number')}</CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber?.hasChanged === true && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.phone-number')}>
                  <p>{state.phoneNumber.value.primary}</p>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {state.phoneNumber?.hasChanged === false && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.phone-number')}>
                  <div>
                    <p>{defaultDisplayValues.phoneNumber}</p>
                  </div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.phoneNumber && defaultDisplayValues.phoneNumber && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.phone-number')}>
                  <div>
                    <p>{defaultDisplayValues.phoneNumber}</p>
                  </div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.phoneNumber && !defaultDisplayValues.phoneNumber && <p>{t('protected-application-full-adult:contact-information.phone-number-help')}</p>}
          </CardContent>
          {state.phoneNumber ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/phone-number" params={params} startIcon={sections.phoneNumber.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.phoneNumber.completed ? t('protected-application-full-adult:contact-information.edit-phone-number') : t('protected-application-full-adult:contact-information.add-phone-number')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/phone-number" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-full-adult:contact-information.update-phone-number')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-button" variant="link" name="_action" value={FORM_ACTION.PHONE_NUMBER_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-full-adult:contact-information.phone-number-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-full-adult:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.mailingAddress?.hasChanged === true && state.homeAddress?.hasChanged === true && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.mailing-address')}>
                  <Address
                    address={{
                      address: defaultDisplayValues.mailingAddressInfo?.address ?? '',
                      city: defaultDisplayValues.mailingAddressInfo?.city ?? '',
                      provinceState: defaultDisplayValues.mailingAddressInfo?.province,
                      postalZipCode: defaultDisplayValues.mailingAddressInfo?.postalCode,
                      country: defaultDisplayValues.mailingAddressInfo?.country ?? '',
                    }}
                  />
                </DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.home-address')}>
                  <Address
                    address={{
                      address: defaultDisplayValues.homeAddressInfo?.address ?? '',
                      city: defaultDisplayValues.homeAddressInfo?.city ?? '',
                      provinceState: defaultDisplayValues.homeAddressInfo?.province,
                      postalZipCode: defaultDisplayValues.homeAddressInfo?.postalCode,
                      country: defaultDisplayValues.homeAddressInfo?.country ?? '',
                    }}
                  />
                </DefinitionListItem>
              </DefinitionList>
            )}

            {state.mailingAddress?.hasChanged === false && state.homeAddress?.hasChanged === false && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.mailing-address')}>
                  <div>
                    <Address
                      address={{
                        address: defaultDisplayValues.mailingAddressInfo?.address ?? '',
                        city: defaultDisplayValues.mailingAddressInfo?.city ?? '',
                        provinceState: defaultDisplayValues.mailingAddressInfo?.province,
                        postalZipCode: defaultDisplayValues.mailingAddressInfo?.postalCode,
                        country: defaultDisplayValues.mailingAddressInfo?.country ?? '',
                      }}
                    />
                  </div>
                </DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.home-address')}>
                  <div>
                    <Address
                      address={{
                        address: defaultDisplayValues.homeAddressInfo?.address ?? '',
                        city: defaultDisplayValues.homeAddressInfo?.city ?? '',
                        provinceState: defaultDisplayValues.homeAddressInfo?.province,
                        postalZipCode: defaultDisplayValues.homeAddressInfo?.postalCode,
                        country: defaultDisplayValues.homeAddressInfo?.country ?? '',
                      }}
                    />
                  </div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.mailingAddress && !state.homeAddress && defaultDisplayValues.mailingAddressInfo && defaultDisplayValues.homeAddressInfo && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.mailing-address')}>
                  <div>
                    <Address
                      address={{
                        address: defaultDisplayValues.mailingAddressInfo.address,
                        city: defaultDisplayValues.mailingAddressInfo.city,
                        provinceState: defaultDisplayValues.mailingAddressInfo.province,
                        postalZipCode: defaultDisplayValues.mailingAddressInfo.postalCode,
                        country: defaultDisplayValues.mailingAddressInfo.country ?? '',
                      }}
                    />
                  </div>
                </DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.home-address')}>
                  <div>
                    <Address
                      address={{
                        address: defaultDisplayValues.homeAddressInfo.address ?? '',
                        city: defaultDisplayValues.homeAddressInfo.city ?? '',
                        provinceState: defaultDisplayValues.homeAddressInfo.province,
                        postalZipCode: defaultDisplayValues.homeAddressInfo.postalCode,
                        country: defaultDisplayValues.homeAddressInfo.country ?? '',
                      }}
                    />
                  </div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.mailingAddress && !state.homeAddress && !defaultDisplayValues.mailingAddressInfo && !defaultDisplayValues.homeAddressInfo && <p>{t('protected-application-full-adult:contact-information.address-help')}</p>}
          </CardContent>

          {state.mailingAddress || state.homeAddress ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/mailing-address" params={params} startIcon={sections.address.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.address.completed ? t('protected-application-full-adult:contact-information.edit-address') : t('protected-application-full-adult:contact-information.add-address')}
              </ButtonLink>
            </CardFooter>
          ) : defaultDisplayValues.mailingAddressInfo && defaultDisplayValues.homeAddressInfo ? ( // eslint-disable-line unicorn/no-nested-ternary
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/mailing-address" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-full-adult:contact-information.update-address')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-button" variant="link" className="p-0 pt-5" name="_action" value={FORM_ACTION.ADDRESS_NOT_CHANGED} startIcon={faCircleCheck} size="lg">
                  {t('protected-application-full-adult:contact-information.address-unchanged')}
                </Button>
              </div>
            </CardFooter>
          ) : (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="add-button" variant="link" className="p-0" routeId="protected/application/$id/mailing-address" params={params} startIcon={faCirclePlus} size="lg">
                {t('protected-application-full-adult:contact-information.add-address')}
              </ButtonLink>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-full-adult:contact-information.communication-preferences')}</CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences?.hasChanged === true && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-language')}>{defaultDisplayValues.preferredLanguage}</DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-method')}>{defaultDisplayValues.preferredMethod}</DefinitionListItem>
              </DefinitionList>
            )}

            {state.communicationPreferences?.hasChanged === false && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-language')}>
                  <div>{defaultDisplayValues.preferredLanguage}</div>
                </DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-method')}>
                  <div>{defaultDisplayValues.preferredMethod}</div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.communicationPreferences && defaultDisplayValues.preferredLanguage && defaultDisplayValues.preferredMethod && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-language')}>
                  <div>{defaultDisplayValues.preferredLanguage}</div>
                </DefinitionListItem>
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.preferred-method')}>
                  <div>{defaultDisplayValues.preferredMethod}</div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.communicationPreferences && !defaultDisplayValues.preferredLanguage && !defaultDisplayValues.preferredMethod && <p>{t('protected-application-full-adult:contact-information.communication-preferences-help')}</p>}
          </CardContent>
          {state.communicationPreferences ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/communication-preferences" params={params} startIcon={sections.communicationPreferences.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.communicationPreferences.completed ? t('protected-application-full-adult:contact-information.edit-communication-preferences') : t('protected-application-full-adult:contact-information.add-communication-preferences')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/communication-preferences" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-full-adult:contact-information.update-communication-preferences')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <LoadingButton id="complete-button" variant="link" name="_action" value={FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-full-adult:contact-information.communication-preferences-unchanged')}
                </LoadingButton>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-full-adult:contact-information.email')}</CardTitle>
            <CardAction>{sections.email.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.email && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.email')}>
                  <p>{state.email}</p>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.email && defaultDisplayValues.email && (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:contact-information.email')}>
                  <div>
                    <p>{defaultDisplayValues.email}</p>
                  </div>
                </DefinitionListItem>
              </DefinitionList>
            )}

            {!state.email && !defaultDisplayValues.email && <p>{t('protected-application-full-adult:contact-information.email-help')}</p>}
          </CardContent>
          {state.email ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/email" params={params} startIcon={sections.email.completed ? faPenToSquare : faCirclePlus} size="lg">
                {sections.email.completed ? t('protected-application-full-adult:contact-information.edit-email') : t('protected-application-full-adult:contact-information.add-email')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="protected/application/$id/email" params={params} startIcon={faPenToSquare} size="lg">
                  {t('protected-application-full-adult:contact-information.update-email')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-button" variant="link" name="_action" value={FORM_ACTION.EMAIL_ADDRESS_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('protected-application-full-adult:contact-information.email-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="protected/application/$id/full-adult/dental-insurance" params={params}>
            {t('protected-application-full-adult:contact-information.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/type-of-application" params={params}>
            {t('protected-application-full-adult:contact-information.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

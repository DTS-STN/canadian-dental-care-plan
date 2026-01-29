import { data, useFetcher } from 'react-router';

import { faCircleCheck, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicApplicationSimplifiedAdultState } from '~/.server/routes/helpers/public-application-simplified-adult-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
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

const FORM_ACTION = {
  PHONE_NUMBER_NOT_CHANGED: 'phone-number-not-changed',
  ADDRESS_NOT_CHANGED: 'address-not-changed',
  COMMUNICATION_PREFERENCES_NOT_CHANGED: 'communication-preferences-not-changed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-simplified-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewAdult.contactInformation,
  pageTitleI18nKey: 'application-simplified-adult:contact-information.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationSimplifiedAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-simplified-adult:contact-information.page-title') }) };
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
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicApplicationSimplifiedAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-adult']);

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

export default function RenewAdultContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('simplified-adult', 'contact-information');

  const sections = [
    { id: 'phone-number', completed: state.phoneNumber !== undefined },
    { id: 'address', completed: mailingAddressInfo.hasChanged !== undefined && homeAddressInfo.hasChanged !== undefined },
    { id: 'communication-preferences', completed: state.communicationPreferences !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).map((section) => section.id);
  const allSectionsCompleted = completedSections.length === sections.length;

  const fetcher = useFetcher<typeof action>();

  return (
    <fetcher.Form method="post" noValidate>
      <CsrfTokenInput />
      <div className="max-w-prose space-y-8">
        <ProgressStepper steps={steps} currentStep={currentStep} />
        <div className="space-y-4">
          <p>{t('application:confirm-information')}</p>
          <p>{t('application:required-label')}</p>
          <p>{t('application:sections-completed', { number: completedSections.length, count: sections.length })}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-adult:contact-information.phone-number')}</CardTitle>
            <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber === undefined ? (
              <p>{t('application-simplified-adult:contact-information.phone-number-help')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-simplified-adult:contact-information.phone-number')}>
                  {state.phoneNumber.hasChanged === false ? <p>{t('application-simplified-adult:contact-information.no-change')}</p> : <p>{state.phoneNumber.value.primary}</p>}
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          {state.phoneNumber ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
                {completedSections.includes('phone-number') ? t('application-simplified-adult:contact-information.edit-phone-number') : t('application-simplified-adult:contact-information.add-phone-number')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/phone-number" params={params} startIcon={faPenToSquare} size="lg">
                  {t('application-simplified-adult:contact-information.update-phone-number')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-button" variant="link" name="_action" value={FORM_ACTION.PHONE_NUMBER_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('application-simplified-adult:contact-information.phone-number-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-adult:contact-information.mailing-and-home-address')}</CardTitle>
            <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo.hasChanged === undefined && homeAddressInfo.hasChanged === undefined ? (
              <p>{t('application-simplified-adult:contact-information.address-help')}</p>
            ) : (
              <>
                {mailingAddressInfo.hasChanged === false && homeAddressInfo.hasChanged === false ? (
                  <p>{t('application-simplified-adult:contact-information.no-change')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application-simplified-adult:contact-information.mailing-address')}>
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
                    <DefinitionListItem term={t('application-simplified-adult:contact-information.home-address')}>
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
              <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/mailing-address" params={params} startIcon={completedSections.includes('address') ? faPenToSquare : faCirclePlus} size="lg">
                {completedSections.includes('address') ? t('application-simplified-adult:contact-information.edit-address') : t('application-simplified-adult:contact-information.add-address')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/mailing-address" params={params} startIcon={faPenToSquare} size="lg">
                  {t('application-simplified-adult:contact-information.update-address')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <Button id="complete-button" variant="link" className="p-0 pt-5" name="_action" value={FORM_ACTION.ADDRESS_NOT_CHANGED} startIcon={faCircleCheck} size="lg">
                  {t('application-simplified-adult:contact-information.address-unchanged')}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-simplified-adult:contact-information.communication-preferences')}</CardTitle>
            <CardAction>{completedSections.includes('communication-preferences') && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences === undefined ? (
              <p>{t('application-simplified-adult:contact-information.communication-preferences-help')}</p>
            ) : (
              <>
                {state.communicationPreferences.hasChanged === false ? (
                  <p>{t('application-simplified-adult:contact-information.no-change')}</p>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application-simplified-adult:contact-information.preferred-language')}>{preferredLanguage?.name}</DefinitionListItem>
                    <DefinitionListItem term={t('application-simplified-adult:contact-information.preferred-method')}>{preferredMethod?.name}</DefinitionListItem>
                    <DefinitionListItem term={t('application-simplified-adult:contact-information.preferred-notification-method')}>{preferredNotificationMethod?.name}</DefinitionListItem>
                    {state.email && <DefinitionListItem term={t('application-simplified-adult:contact-information.email')}>{state.email}</DefinitionListItem>}
                  </DefinitionList>
                )}
              </>
            )}
          </CardContent>
          {state.communicationPreferences ? (
            <CardFooter className="border-t bg-zinc-100">
              <ButtonLink
                id="edit-button"
                variant="link"
                className="p-0"
                routeId="public/application/$id/communication-preferences"
                params={params}
                startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus}
                size="lg"
              >
                {completedSections.includes('communication-preferences') ? t('application-simplified-adult:contact-information.edit-communication-preferences') : t('application-simplified-adult:contact-information.add-communication-preferences')}
              </ButtonLink>
            </CardFooter>
          ) : (
            <CardFooter className="divide-y border-t bg-zinc-100 px-0">
              <div className="w-full px-6">
                <ButtonLink id="update-button" variant="link" className="p-0 pb-5" routeId="public/application/$id/communication-preferences" params={params} startIcon={faPenToSquare} size="lg">
                  {t('application-simplified-adult:contact-information.update-communication-preferences')}
                </ButtonLink>
              </div>
              <div className="w-full px-6">
                <LoadingButton id="complete-button" variant="link" name="_action" value={FORM_ACTION.COMMUNICATION_PREFERENCES_NOT_CHANGED} className="p-0 pt-5" startIcon={faCircleCheck} size="lg">
                  {t('application-simplified-adult:contact-information.communication-preferences-unchanged')}
                </LoadingButton>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/simplified-adult/dental-insurance" params={params}>
            {t('application-simplified-adult:contact-information.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
            {t('application-simplified-adult:contact-information.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </fetcher.Form>
  );
}

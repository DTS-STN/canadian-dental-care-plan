import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullChildState } from '~/.server/routes/helpers/public-application-full-child-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isMaritalStatusSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/public-application-full-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-children/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-child', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullChild.parentOrGuardian,
  pageTitleI18nKey: 'application-full-child:parent-or-guardian.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullChildState({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-child:parent-or-guardian.page-title') }) };
  const locale = getLocale(request);

  const mailingAddressInfo = state.mailingAddress?.hasChanged
    ? {
        address: state.mailingAddress.value.address,
        city: state.mailingAddress.value.city,
        province: state.mailingAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getLocalizedProvinceTerritoryStateById(state.mailingAddress.value.province, locale) : undefined,
        postalCode: state.mailingAddress.value.postalCode,
        country: await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.mailingAddress.value.country, locale),
      }
    : undefined;

  const homeAddressInfo = state.homeAddress?.hasChanged
    ? {
        address: state.homeAddress.value.address,
        city: state.homeAddress.value.city,
        province: state.homeAddress.value.province ? await appContainer.get(TYPES.ProvinceTerritoryStateService).getLocalizedProvinceTerritoryStateById(state.homeAddress.value.province, locale) : undefined,
        postalCode: state.homeAddress.value.postalCode,
        country: await appContainer.get(TYPES.CountryService).getLocalizedCountryById(state.homeAddress.value.country, locale),
      }
    : undefined;

  return {
    state: {
      maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined,
      partnerInformation: state.partnerInformation,
      phoneNumber: state.phoneNumber,
      communicationPreferences: state.communicationPreferences,
      email: state.email,
    },
    mailingAddressInfo,
    homeAddressInfo,
    preferredLanguage: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale) : undefined,
    preferredMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale) : undefined,
    preferredNotificationMethod: state.communicationPreferences?.hasChanged ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale) : undefined,
    sections: {
      maritalStatus: { completed: isMaritalStatusSectionCompleted(state) },
      phoneNumber: { completed: isPhoneNumberSectionCompleted(state) },
      address: { completed: isAddressSectionCompleted(state) },
      communicationPreferences: { completed: isCommunicationPreferencesSectionCompleted(state) },
    },
    meta,
  };
}

export default function NewChildParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="parent-or-guardian" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-child:parent-or-guardian.marital-status')}</CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t('application-full-child:parent-or-guardian.select-your-status')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.marital-status')}>
                  <p>{state.maritalStatus.name}</p>
                </DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t('application-full-child:parent-or-guardian.spouse-sin')}>
                      <p>{formatSin(state.partnerInformation.socialInsuranceNumber)}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-full-child:parent-or-guardian.spouse-yob')}>
                      <p>{state.partnerInformation.yearOfBirth}</p>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application-full-child:parent-or-guardian.consent')}>
                      {state.partnerInformation.confirm ? t('application-full-child:parent-or-guardian.consent-yes') : t('application-full-child:parent-or-guardian.consent-no')}
                    </DefinitionListItem>
                  </>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-marital-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/marital-status"
              params={params}
              startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Edit marital click"
            >
              {state.maritalStatus === undefined ? t('application-full-child:parent-or-guardian.add-marital-status') : t('application-full-child:parent-or-guardian.edit-marital-status')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-child:parent-or-guardian.phone-number')}</CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.phone-number')}>
                  <p>{state.phoneNumber.value.primary}</p>
                </DefinitionListItem>
                {state.phoneNumber.value.alternate && (
                  <DefinitionListItem term={t('application-full-child:parent-or-guardian.alt-phone-number')}>
                    <p>{state.phoneNumber.value.alternate}</p>
                  </DefinitionListItem>
                )}
              </DefinitionList>
            ) : (
              <p>{t('application-full-child:parent-or-guardian.phone-number-help')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-phone-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/phone-number"
              params={params}
              startIcon={sections.phoneNumber.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Edit phone click"
            >
              {sections.phoneNumber.completed ? t('application-full-child:parent-or-guardian.edit-phone-number') : t('application-full-child:parent-or-guardian.add-phone-number')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-child:parent-or-guardian.mailing-and-home-address')}</CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo === undefined || homeAddressInfo === undefined ? (
              <p>{t('application-full-child:parent-or-guardian.address-help')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.mailing-address')}>
                  <Address
                    address={{
                      address: mailingAddressInfo.address,
                      city: mailingAddressInfo.city,
                      provinceState: mailingAddressInfo.province?.abbr,
                      postalZipCode: mailingAddressInfo.postalCode,
                      country: mailingAddressInfo.country.name,
                    }}
                  />
                </DefinitionListItem>
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.home-address')}>
                  <Address
                    address={{
                      address: homeAddressInfo.address,
                      city: homeAddressInfo.city,
                      provinceState: homeAddressInfo.province?.abbr,
                      postalZipCode: homeAddressInfo.postalCode,
                      country: homeAddressInfo.country.name,
                    }}
                  />
                </DefinitionListItem>
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-address-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/mailing-address"
              params={params}
              startIcon={sections.address.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Edit address click"
            >
              {sections.address.completed ? t('application-full-child:parent-or-guardian.edit-address') : t('application-full-child:parent-or-guardian.add-address')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-child:parent-or-guardian.communication-preferences')}</CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.preferred-language')}>{preferredLanguage?.name}</DefinitionListItem>
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.preferred-method')}>{preferredMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.preferred-notification-method')}>{preferredNotificationMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t('application-full-child:parent-or-guardian.email')}>{state.email}</DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('application-full-child:parent-or-guardian.communication-preferences-help')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-comms-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/communication-preferences"
              params={params}
              startIcon={sections.communicationPreferences.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Edit comms click"
            >
              {sections.communicationPreferences.completed ? t('application-full-child:parent-or-guardian.edit-communication-preferences') : t('application-full-child:parent-or-guardian.add-communication-preferences')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="public/application/$id/full-children/childrens-application"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Continue click"
          >
            {t('application-full-child:parent-or-guardian.childrens-application')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Back click">
            {t('application-full-child:parent-or-guardian.type-of-application')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

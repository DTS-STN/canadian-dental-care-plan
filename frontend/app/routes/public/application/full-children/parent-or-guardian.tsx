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
  i18nNamespaces: getTypedI18nNamespaces('application', 'applicationFullChild', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullChild.parentOrGuardian,
  pageTitleI18nKey: 'applicationFullChild:parentOrGuardian.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullChildState({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.parentOrGuardian.pageTitle, { ns: 'applicationFullChild' }) }),
  };
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
      <ProgressStepper activeStep="parentOrGuardian" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t(($) => $.completeAllSections)}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.parentOrGuardian.maritalStatus, { ns: 'applicationFullChild' })}</h2>
            </CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t(($) => $.parentOrGuardian.selectYourStatus, { ns: 'applicationFullChild' })}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.parentOrGuardian.maritalStatus, { ns: 'applicationFullChild' })}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t(($) => $.parentOrGuardian.spouseSin, { ns: 'applicationFullChild' })}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.parentOrGuardian.spouseYob, { ns: 'applicationFullChild' })}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.parentOrGuardian.consent, { ns: 'applicationFullChild' })}>{t(($) => $.parentOrGuardian.consentYes, { ns: 'applicationFullChild' })}</DefinitionListItem>
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
              {state.maritalStatus === undefined ? t(($) => $.parentOrGuardian.addMaritalStatus, { ns: 'applicationFullChild' }) : t(($) => $.parentOrGuardian.editMaritalStatus, { ns: 'applicationFullChild' })}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.parentOrGuardian.phoneNumber, { ns: 'applicationFullChild' })}</h2>
            </CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.parentOrGuardian.phoneNumber, { ns: 'applicationFullChild' })}>{state.phoneNumber.value.primary}</DefinitionListItem>
                {state.phoneNumber.value.alternate && <DefinitionListItem term={t(($) => $.parentOrGuardian.altPhoneNumber, { ns: 'applicationFullChild' })}>{state.phoneNumber.value.alternate}</DefinitionListItem>}
              </DefinitionList>
            ) : (
              <p>{t(($) => $.parentOrGuardian.phoneNumberHelp, { ns: 'applicationFullChild' })}</p>
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
              {sections.phoneNumber.completed ? t(($) => $.parentOrGuardian.editPhoneNumber, { ns: 'applicationFullChild' }) : t(($) => $.parentOrGuardian.addPhoneNumber, { ns: 'applicationFullChild' })}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.parentOrGuardian.mailingAndHomeAddress, { ns: 'applicationFullChild' })}</h2>
            </CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo === undefined || homeAddressInfo === undefined ? (
              <p>{t(($) => $.parentOrGuardian.addressHelp, { ns: 'applicationFullChild' })}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.parentOrGuardian.mailingAddress, { ns: 'applicationFullChild' })}>
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
                <DefinitionListItem term={t(($) => $.parentOrGuardian.homeAddress, { ns: 'applicationFullChild' })}>
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
              {sections.address.completed ? t(($) => $.parentOrGuardian.editAddress, { ns: 'applicationFullChild' }) : t(($) => $.parentOrGuardian.addAddress, { ns: 'applicationFullChild' })}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.parentOrGuardian.communicationPreferences, { ns: 'applicationFullChild' })}</h2>
            </CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.parentOrGuardian.preferredLanguage, { ns: 'applicationFullChild' })}>{preferredLanguage?.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.parentOrGuardian.preferredMethod, { ns: 'applicationFullChild' })}>{preferredMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.parentOrGuardian.preferredNotificationMethod, { ns: 'applicationFullChild' })}>{preferredNotificationMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t(($) => $.parentOrGuardian.email, { ns: 'applicationFullChild' })}>{state.email}</DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t(($) => $.parentOrGuardian.communicationPreferencesHelp, { ns: 'applicationFullChild' })}</p>
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
              {sections.communicationPreferences.completed ? t(($) => $.parentOrGuardian.editCommunicationPreferences, { ns: 'applicationFullChild' }) : t(($) => $.parentOrGuardian.addCommunicationPreferences, { ns: 'applicationFullChild' })}
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
            {t(($) => $.parentOrGuardian.childrensApplication, { ns: 'applicationFullChild' })}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/your-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Back click">
            {t(($) => $.parentOrGuardian.yourApplication, { ns: 'applicationFullChild' })}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

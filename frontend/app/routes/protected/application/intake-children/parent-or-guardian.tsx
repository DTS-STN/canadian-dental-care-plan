import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeChildState } from '~/.server/routes/helpers/protected-application-intake-child-route-helpers';
import { isAddressSectionCompleted, isCommunicationPreferencesSectionCompleted, isEmailSectionCompleted, isMaritalStatusSectionCompleted, isPhoneNumberSectionCompleted } from '~/.server/routes/helpers/protected-application-intake-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/intake-children/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedApplication', 'protectedApplicationIntakeChild', 'gcweb'),
  pageIdentifier: pageIds.protected.application.intakeChild.parentOrGuardian,
  pageTitleI18nKey: 'protectedApplicationIntakeChild:parentOrGuardian.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeChildState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protectedApplicationIntakeChild:parentOrGuardian.pageTitle') }) };
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
      email: { completed: isEmailSectionCompleted(state) },
    },
    meta,
  };
}

export default function ProtectedNewChildParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="parentOrGuardian" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protectedApplication:completeAllSections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protectedApplicationIntakeChild:parentOrGuardian.maritalStatus')}</h2>
            </CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t('protectedApplicationIntakeChild:parentOrGuardian.selectYourStatus')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.maritalStatus')}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.spouseSin')}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.spouseYob')}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.consent')}>{t('protectedApplicationIntakeChild:parentOrGuardian.consentYes')}</DefinitionListItem>
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
              routeId="protected/application/$id/marital-status"
              params={params}
              startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Edit marital click"
            >
              {state.maritalStatus === undefined ? t('protectedApplicationIntakeChild:parentOrGuardian.addMaritalStatus') : t('protectedApplicationIntakeChild:parentOrGuardian.editMaritalStatus')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protectedApplicationIntakeChild:parentOrGuardian.phoneNumber')}</h2>
            </CardTitle>
            <CardAction>{sections.phoneNumber.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.phoneNumber?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.phoneNumber')}>{state.phoneNumber.value.primary}</DefinitionListItem>
                {state.phoneNumber.value.alternate && <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.altPhoneNumber')}>{state.phoneNumber.value.alternate}</DefinitionListItem>}
              </DefinitionList>
            ) : (
              <p>{t('protectedApplicationIntakeChild:parentOrGuardian.phoneNumberHelp')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-phone-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/phone-number"
              params={params}
              startIcon={sections.phoneNumber.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Edit phone click"
            >
              {sections.phoneNumber.completed ? t('protectedApplicationIntakeChild:parentOrGuardian.editPhoneNumber') : t('protectedApplicationIntakeChild:parentOrGuardian.addPhoneNumber')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protectedApplicationIntakeChild:parentOrGuardian.mailingAndHomeAddress')}</h2>
            </CardTitle>
            <CardAction>{sections.address.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {mailingAddressInfo === undefined || homeAddressInfo === undefined ? (
              <p>{t('protectedApplicationIntakeChild:parentOrGuardian.addressHelp')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.mailingAddress')}>
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
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.homeAddress')}>
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
              routeId="protected/application/$id/mailing-address"
              params={params}
              startIcon={sections.address.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Edit address click"
            >
              {sections.address.completed ? t('protectedApplicationIntakeChild:parentOrGuardian.editAddress') : t('protectedApplicationIntakeChild:parentOrGuardian.addAddress')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protectedApplicationIntakeChild:parentOrGuardian.communicationPreferences')}</h2>
            </CardTitle>
            <CardAction>{sections.communicationPreferences.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.communicationPreferences?.hasChanged ? (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.preferredLanguage')}>{preferredLanguage?.name}</DefinitionListItem>
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.preferredMethod')}>{preferredMethod?.name}</DefinitionListItem>
                <DefinitionListItem term={t('protectedApplicationIntakeChild:parentOrGuardian.preferredNotificationMethod')}>{preferredNotificationMethod?.name}</DefinitionListItem>
              </DefinitionList>
            ) : (
              <p>{t('protectedApplicationIntakeChild:parentOrGuardian.communicationPreferencesHelp')}</p>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-comms-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/communication-preferences"
              params={params}
              startIcon={sections.communicationPreferences.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Edit comms click"
            >
              {sections.communicationPreferences.completed ? t('protectedApplicationIntakeChild:parentOrGuardian.editCommunicationPreferences') : t('protectedApplicationIntakeChild:parentOrGuardian.addCommunicationPreferences')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t('protectedApplicationIntakeChild:parentOrGuardian.email')}</h2>
            </CardTitle>
            <CardAction>{sections.email.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>{loaderData.state.email === undefined ? <p>{t('protectedApplicationIntakeChild:parentOrGuardian.emailHelp')}</p> : <p>{loaderData.state.email}</p>}</CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-email-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/email"
              params={params}
              startIcon={sections.email.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Edit email click"
            >
              {sections.email.completed ? t('protectedApplicationIntakeChild:parentOrGuardian.editEmail') : t('protectedApplicationIntakeChild:parentOrGuardian.addEmail')}
            </ButtonLink>
          </CardFooter>
        </Card>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/intake-children/childrens-application"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Continue click"
          >
            {t('protectedApplicationIntakeChild:parentOrGuardian.childrensApplication')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/your-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Child:Back click">
            {t('protectedApplicationIntakeChild:parentOrGuardian.yourApplication')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}

import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationChildState } from '~/.server/routes/helpers/public-application-child-route-helpers';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-child', 'gcweb'),
  pageIdentifier: pageIds.public.application.newChild.parentOrGuardian,
  pageTitleI18nKey: 'application-new-child:parent-or-guardian.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationChildState({ params, request, session });
  validateApplicationTypeAndFlow(state, params, ['new-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-child:parent-or-guardian.page-title') }) };
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
    meta,
  };
}

export default function NewChildParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { state, mailingAddressInfo, homeAddressInfo, preferredLanguage, preferredMethod, preferredNotificationMethod } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('new-children', 'parent-or-guardian');

  const sections = [
    { id: 'marital-status', completed: state.maritalStatus !== undefined },
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
          <CardTitle>{t('application-new-child:parent-or-guardian.marital-status')}</CardTitle>
          <CardAction>{completedSections.includes('marital-status') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.maritalStatus === undefined ? (
            <p>{t('application-new-child:parent-or-guardian.select-your-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.marital-status')}>
                <p>{state.maritalStatus.name}</p>
              </DescriptionListItem>
              {state.partnerInformation && (
                <>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.spouse-sin')}>
                    <p>{state.partnerInformation.socialInsuranceNumber}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.spouse-yob')}>
                    <p>{state.partnerInformation.yearOfBirth}</p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('application-new-child:parent-or-guardian.consent')}>
                    {state.partnerInformation.confirm ? t('application-new-child:parent-or-guardian.consent-yes') : t('application-new-child:parent-or-guardian.consent-no')}
                  </DescriptionListItem>
                </>
              )}
            </dl>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/marital-status" params={params} startIcon={faCirclePlus} size="lg">
            {state.maritalStatus === undefined ? t('application-new-child:parent-or-guardian.add-marital-status') : t('application-new-child:parent-or-guardian.edit-marital-status')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-child:parent-or-guardian.phone-number')}</CardTitle>
          <CardAction>{completedSections.includes('phone-number') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.phoneNumber?.hasChanged ? (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.phone-number')}>
                <p>{state.phoneNumber.value.primary}</p>
              </DescriptionListItem>
              {state.phoneNumber.value.alternate && (
                <DescriptionListItem term={t('application-new-child:parent-or-guardian.alt-phone-number')}>
                  <p>{state.phoneNumber.value.alternate}</p>
                </DescriptionListItem>
              )}
            </dl>
          ) : (
            <p>{t('application-new-child:parent-or-guardian.phone-number-help')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/phone-number" params={params} startIcon={completedSections.includes('phone-number') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('phone-number') ? t('application-new-child:parent-or-guardian.edit-phone-number') : t('application-new-child:parent-or-guardian.add-phone-number')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-child:parent-or-guardian.mailing-and-home-address')}</CardTitle>
          <CardAction>{completedSections.includes('address') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {mailingAddressInfo.address === undefined && homeAddressInfo.address === undefined ? (
            <p>{t('application-new-child:parent-or-guardian.address-help')}</p>
          ) : (
            <dl className="divide-y border-y">
              {mailingAddressInfo.address !== undefined && (
                <DescriptionListItem term={t('application-new-child:parent-or-guardian.mailing-address')}>
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
                <DescriptionListItem term={t('application-new-child:parent-or-guardian.home-address')}>
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
            {completedSections.includes('address') ? t('application-new-child:parent-or-guardian.edit-address') : t('application-new-child:parent-or-guardian.add-address')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('application-new-child:parent-or-guardian.communication-preferences')}</CardTitle>
          <CardAction>{completedSections.includes('communication-preferences') && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {state.communicationPreferences?.hasChanged ? (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.preferred-language')}>{preferredLanguage?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.preferred-method')}>{preferredMethod?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.preferred-notification-method')}>{preferredNotificationMethod?.name}</DescriptionListItem>
              <DescriptionListItem term={t('application-new-child:parent-or-guardian.email')}>{state.email}</DescriptionListItem>
            </dl>
          ) : (
            <p>{t('application-new-child:parent-or-guardian.communication-preferences-help')}</p>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/communication-preferences" params={params} startIcon={completedSections.includes('communication-preferences') ? faPenToSquare : faCirclePlus} size="lg">
            {completedSections.includes('communication-preferences') ? t('application-new-child:parent-or-guardian.edit-communication-preferences') : t('application-new-child:parent-or-guardian.add-communication-preferences')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/new-children/childrens-application" params={params}>
          {t('application-new-child:parent-or-guardian.childrens-application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
          {t('application-new-child:parent-or-guardian.type-of-application')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}

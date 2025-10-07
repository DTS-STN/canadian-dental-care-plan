import { useEffect, useMemo, useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/home-address';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.editHomeAddress,
  pageTitleI18nKey: 'protected-profile:home-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = await appContainer.get(TYPES.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:home-address.page-title') }) };

  return {
    meta,
    defaultState: {
      address: clientApplication.contactInformation.homeAddress,
      city: clientApplication.contactInformation.homeCity,
      postalCode: clientApplication.contactInformation.homePostalCode,
      province: clientApplication.contactInformation.homeProvince,
      country: clientApplication.contactInformation.homeCountry,
    },
    countryList,
    regionList,
  };
}

export function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  //TODO: update action for address verification
  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function EditHomeAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState.country);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);

  //TODO: hook in errors from action when available
  const errors = undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'home-address',
    city: 'home-city',
    postalZipCode: 'home-postal-code',
    provinceStateId: 'home-province',
    countryId: 'home-country',
    syncAddresses: 'sync-addresses',
  });

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedHomeCountry);
    setHomeCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedHomeCountry, regionList]);

  const homeCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedHomeCountry(event.currentTarget.value);
  };

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  const homeRegions = useMemo<InputOptionProps[]>(() => homeCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [homeCountryRegions]);

  const dummyOption: InputOptionProps = { children: t('protected-profile:home-address.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedHomeCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <div className="space-y-6">
            <InputSanitizeField
              id="home-address"
              name="address"
              className="w-full"
              label={t('protected-profile:home-address.address')}
              maxLength={100}
              helpMessagePrimary={t('protected-profile:home-address.address-help')}
              helpMessagePrimaryClassName="text-black"
              autoComplete="address-line1"
              defaultValue={defaultState.address}
              errorMessage={undefined}
              required
            />
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField id="home-city" name="city" className="w-full" label={t('protected-profile:home-address.city')} maxLength={100} autoComplete="address-level2" defaultValue={defaultState.city} errorMessage={undefined} required />
              <InputSanitizeField
                id="home-postal-code"
                name="postalZipCode"
                className="w-full"
                label={isPostalCodeRequired ? t('protected-profile:home-address.postal-code') : t('protected-profile:home-address.postal-code-optional')}
                maxLength={100}
                autoComplete="postal-code"
                defaultValue={defaultState.postalCode}
                errorMessage={undefined}
                required={isPostalCodeRequired}
              />
            </div>

            {homeRegions.length > 0 && (
              <InputSelect
                id="home-province"
                name="provinceStateId"
                className="w-full sm:w-1/2"
                label={t('protected-profile:home-address.province')}
                defaultValue={defaultState.province}
                errorMessage={undefined}
                options={[dummyOption, ...homeRegions]}
                required
              />
            )}
            <InputSelect
              id="home-country"
              name="countryId"
              className="w-full sm:w-1/2"
              label={t('protected-profile:home-address.country')}
              autoComplete="country"
              defaultValue={defaultState.country}
              errorMessage={undefined}
              options={countries}
              onChange={homeCountryChangeHandler}
              required
            />
          </div>
        </fieldset>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting}>
            {t('protected-profile:home-address.save-btn')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/contact-information" params={params} disabled={isSubmitting}>
            {t('protected-profile:home-address.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

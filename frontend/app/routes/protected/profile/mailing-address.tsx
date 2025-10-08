import { useEffect, useMemo, useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Route } from './+types/mailing-address';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
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
  pageIdentifier: pageIds.protected.profile.editMailingAddress,
  pageTitleI18nKey: 'protected-profile:mailing-address.page-title',
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:mailing-address.page-title') }) };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.mailing-address', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      address: clientApplication.contactInformation.mailingAddress,
      city: clientApplication.contactInformation.mailingCity,
      postalCode: clientApplication.contactInformation.mailingPostalCode,
      province: clientApplication.contactInformation.mailingProvince,
      country: clientApplication.contactInformation.mailingCountry,
      copyMailing: clientApplication.contactInformation.copyMailingAddress,
    },
    countryList,
    regionList,
  };
}

export function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  //TODO: update action for address verification

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.mailing-address', { userId: idToken.sub });

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function EditMailingAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.country);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState.copyMailing === true);

  //TODO: hook in errors from action when available
  const errors = undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'mailing-address',
    city: 'mailing-city',
    postalZipCode: 'mailing-postal-code',
    provinceStateId: 'mailing-province',
    countryId: 'mailing-country',
    syncAddresses: 'sync-addresses',
  });

  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedMailingCountry);
    setMailingCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedMailingCountry, regionList]);

  const mailingCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedMailingCountry(event.currentTarget.value);
  };

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  const mailingRegions = useMemo<InputOptionProps[]>(() => mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [mailingCountryRegions]);

  const dummyOption: InputOptionProps = { children: t('protected-profile:mailing-address.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <div className="space-y-6">
            <InputSanitizeField
              id="mailing-address"
              name="address"
              className="w-full"
              label={t('protected-profile:mailing-address.address')}
              maxLength={100}
              helpMessagePrimary={t('protected-profile:mailing-address.address-help')}
              helpMessagePrimaryClassName="text-black"
              autoComplete="address-line1"
              defaultValue={defaultState.address}
              errorMessage={undefined}
              required
            />
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField id="mailing-city" name="city" className="w-full" label={t('protected-profile:mailing-address.city')} maxLength={100} autoComplete="address-level2" defaultValue={defaultState.city} errorMessage={undefined} required />
              <InputSanitizeField
                id="mailing-postal-code"
                name="postalZipCode"
                className="w-full"
                label={isPostalCodeRequired ? t('protected-profile:mailing-address.postal-code') : t('protected-profile:mailing-address.postal-code-optional')}
                maxLength={100}
                autoComplete="postal-code"
                defaultValue={defaultState.postalCode}
                errorMessage={undefined}
                required={isPostalCodeRequired}
              />
            </div>

            {mailingRegions.length > 0 && (
              <InputSelect
                id="mailing-province"
                name="provinceStateId"
                className="w-full sm:w-1/2"
                label={t('protected-profile:mailing-address.province')}
                defaultValue={defaultState.province}
                errorMessage={undefined}
                options={[dummyOption, ...mailingRegions]}
                required
              />
            )}
            <InputSelect
              id="mailing-country"
              name="countryId"
              className="w-full sm:w-1/2"
              label={t('protected-profile:mailing-address.country')}
              autoComplete="country"
              defaultValue={defaultState.country}
              errorMessage={undefined}
              options={countries}
              onChange={mailingCountryChangeHandler}
              required
            />
            <InputCheckbox id="sync-addresses" name="syncAddresses" value="true" checked={copyAddressChecked} onChange={checkHandler}>
              {t('protected-profile:mailing-address.use-mailing-address')}
            </InputCheckbox>
          </div>
        </fieldset>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Save - Mailing address click">
            {t('protected-profile:mailing-address.continue-btn')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/contact-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Mailing address click">
            {t('protected-profile:mailing-address.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

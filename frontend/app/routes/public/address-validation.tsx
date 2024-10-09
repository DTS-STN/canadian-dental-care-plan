import { useEffect, useMemo, useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { PublicLayout } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('address-validation', 'gcweb'),
  pageTitleI18nKey: 'address-validation:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, request }: LoaderFunctionArgs) {
  featureEnabled('address-validation');
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = configProvider.getServerConfig();

  const locale = getLocale(request);
  const countries = serviceProvider.getCountryService().listAndSortLocalizedCountries(locale);
  const provinceTerritoryStates = serviceProvider.getProvinceTerritoryStateService().listAndSortLocalizedProvinceTerritoryStates(locale);

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:page-title') }) };

  return {
    CANADA_COUNTRY_ID,
    countries,
    csrfToken,
    meta,
    provinceTerritoryStates,
    USA_COUNTRY_ID,
  };
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  featureEnabled('address-validation');

  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  return null;
}

export default function AddressValidationRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, countries, csrfToken, provinceTerritoryStates, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedCountry, setSelectedCountry] = useState(CANADA_COUNTRY_ID);
  const [countryProvinceTerritoryStates, setCountryProvinceTerritoryStates] = useState<typeof provinceTerritoryStates>(
    provinceTerritoryStates.filter(({ countryId }) => {
      return countryId === selectedCountry;
    }),
  );

  useEffect(() => {
    const filteredProvinceTerritoryStates = countryProvinceTerritoryStates.filter(({ countryId }) => {
      return countryId === selectedCountry;
    });
    setCountryProvinceTerritoryStates(filteredProvinceTerritoryStates);
  }, [selectedCountry, countryProvinceTerritoryStates]);

  const mailingCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.currentTarget.value);
  };

  const countryInputOptions = useMemo<InputOptionProps[]>(() => {
    return countries.map(({ id, name }) => ({ children: name, value: id }));
  }, [countries]);

  const countryProvinceTerritoryStateInputOptions: InputOptionProps[] = useMemo<InputOptionProps[]>(() => {
    return countryProvinceTerritoryStates.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryProvinceTerritoryStates]);

  const postalCodeRequiredContries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const postalCodeRequired = postalCodeRequiredContries.includes(selectedCountry);

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('address-validation:optional-label')}</p>
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('address-validation:address-header')}</legend>
            <div className="space-y-6">
              <InputSanitizeField
                id="mailing-address"
                name="mailingAddress"
                className="w-full"
                label={t('address-validation:address-field.address')}
                maxLength={30}
                helpMessagePrimary={t('address-validation:address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue=""
                // errorMessage={errors?.mailingAddress}
                required
              />
              <InputSanitizeField
                id="mailing-apartment"
                name="mailingApartment"
                className="w-full"
                label={t('address-validation:address-field.apartment')}
                maxLength={30}
                autoComplete="address-line2"
                defaultValue=""
                // errorMessage={errors?.mailingApartment}
              />
              <InputSelect
                id="mailing-country"
                name="mailingCountry"
                className="w-full sm:w-1/2"
                label={t('address-validation:address-field.country')}
                autoComplete="country"
                defaultValue=""
                // errorMessage={errors?.mailingCountry}
                options={countryInputOptions}
                onChange={mailingCountryChangeHandler}
                required
              />
              {countryProvinceTerritoryStateInputOptions.length > 0 && (
                <InputSelect
                  id="mailing-province"
                  name="mailingProvince"
                  className="w-full sm:w-1/2"
                  label={t('address-validation:address-field.province')}
                  defaultValue=""
                  // errorMessage={errors?.mailingProvince}
                  options={countryProvinceTerritoryStateInputOptions}
                  required
                />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField
                  id="mailing-city"
                  name="mailingCity"
                  className="w-full"
                  label={t('address-validation:address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  defaultValue=""
                  // errorMessage={errors?.mailingCity}
                  required
                />
                <InputSanitizeField
                  id="mailing-postal-code"
                  name="mailingPostalCode"
                  className="w-full"
                  label={postalCodeRequired ? t('address-validation:address-field.postal-code') : t('address-validation:address-field.postal-code-optional')}
                  maxLength={100}
                  autoComplete="postal-code"
                  defaultValue=""
                  // errorMessage={errors?.mailingPostalCode}
                  required={postalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <LoadingButton variant="primary" id="submit-button" loading={isSubmitting} endIcon={faCheck}>
              {t('address-validation:submit-button')}
            </LoadingButton>
          </div>
        </fetcher.Form>
      </div>
    </PublicLayout>
  );
}

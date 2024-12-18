import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { HomeAddressState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/.server/utils/postal-zip-code.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmHomeAddress,
  pageTitleI18nKey: 'protected-renew:update-address.home-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const homeAddressInfo = state.homeAddress
    ? {
        address: state.homeAddress.address,
        city: state.homeAddress.city,
        province: state.homeAddress.province,
        postalCode: state.homeAddress.postalCode,
        country: state.homeAddress.country,
        apartment: state.homeAddress.apartment,
      }
    : {
        address: state.clientApplication.contactInformation.homeAddress,
        city: state.clientApplication.contactInformation.homeCity,
        province: state.clientApplication.contactInformation.homeProvince,
        postalCode: state.clientApplication.contactInformation.homePostalCode,
        country: state.clientApplication.contactInformation.homeCountry,
        apartment: state.clientApplication.contactInformation.homeApartment,
      };

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:update-address.home-address.page-title') }) };

  return {
    meta,
    defaultState: { ...homeAddressInfo },
    countryList,
    regionList,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const homeAddressSchema = z
    .object({
      address: z.string().trim().max(30).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')),
      country: z.string().trim(),
      province: z.string().trim().optional(),
      city: z.string().trim().max(100).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')),
      postalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (!val.address || validator.isEmpty(val.address)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.address-required'), path: ['address'] });
      }

      if (!val.country || validator.isEmpty(val.country)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.country-required'), path: ['country'] });
      }

      if (!val.city || validator.isEmpty(val.city)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.city-required'), path: ['city'] });
      }

      if (val.country === CANADA_COUNTRY_ID || val.country === USA_COUNTRY_ID) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.province-required'), path: ['province'] });
        }
        if (!val.postalCode || validator.isEmpty(val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.postal-code-required'), path: ['postalCode'] });
        } else if (!isValidPostalCode(val.country, val.postalCode)) {
          const message = val.country === CANADA_COUNTRY_ID ? t('protected-renew:update-address.error-message.home-address.postal-code-valid') : t('protected-renew:update-address.error-message.home-address.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['postalCode'] });
        } else if (val.country === CANADA_COUNTRY_ID && val.province && !isValidCanadianPostalCode(val.province, val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.invalid-postal-code-for-province'), path: ['postalCode'] });
        }
      }

      if (val.country && val.country !== CANADA_COUNTRY_ID && val.postalCode && isValidPostalCode(CANADA_COUNTRY_ID, val.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.home-address.invalid-postal-code-for-country'), path: ['country'] });
      }
    })
    .transform((val) => ({
      ...val,
      postalCode: val.country && val.postalCode ? formatPostalCode(val.country, val.postalCode) : val.postalCode,
    })) satisfies z.ZodType<HomeAddressState>;

  const parsedDataResult = homeAddressSchema.safeParse({
    address: String(formData.get('homeAddress')),
    country: String(formData.get('homeCountry')),
    province: formData.get('homeProvince') ? String(formData.get('homeProvince')) : undefined,
    city: String(formData.get('homeCity')),
    postalCode: formData.get('homePostalCode') ? String(formData.get('homePostalCode')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({ params, session, state: { homeAddress: parsedDataResult.data } });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmHomeAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = useLoaderData<typeof loader>();
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState.country);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    address: 'home-address',
    province: 'home-province',
    country: 'home-country',
    city: 'home-city',
    postalCode: 'home-postal-code',
  });

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedHomeCountry);
    setHomeCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedHomeCountry, regionList]);

  const homeCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedHomeCountry(event.currentTarget.value);
  };

  // populate home region/province/state list with selected country or current address country
  const homeRegions: InputOptionProps[] = homeCountryRegions.map(({ id, name }) => ({ children: name, value: id }));

  const dummyOption: InputOptionProps = { children: t('protected-renew:update-address.address-field.select-one'), value: '' };

  const postalCodeRequiredContries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const homePostalCodeRequired = postalCodeRequiredContries.includes(selectedHomeCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputSanitizeField
            id="home-address"
            name="homeAddress"
            className="w-full"
            label={t('protected-renew:update-address.address-field.address')}
            helpMessagePrimary={t('protected-renew:update-address.address-field.address-note')}
            helpMessagePrimaryClassName="text-black"
            maxLength={30}
            autoComplete="address-line1"
            defaultValue={defaultState.address}
            errorMessage={errors?.address}
            required
          />
          <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
            <InputSanitizeField
              id="home-city"
              name="homeCity"
              className="w-full"
              label={t('protected-renew:update-address.address-field.city')}
              maxLength={100}
              autoComplete="address-level2"
              defaultValue={defaultState.city}
              errorMessage={errors?.city}
              required
            />
            <InputSanitizeField
              id="home-postal-code"
              name="homePostalCode"
              className="w-full"
              label={homePostalCodeRequired ? t('protected-renew:update-address.address-field.postal-code') : t('protected-renew:update-address.address-field.postal-code-optional')}
              maxLength={100}
              autoComplete="postal-code"
              defaultValue={defaultState.postalCode ?? ''}
              errorMessage={errors?.postalCode}
              required={homePostalCodeRequired}
            />
          </div>
          {homeRegions.length > 0 && (
            <InputSelect
              id="home-province"
              name="homeProvince"
              className="w-full sm:w-1/2"
              label={t('protected-renew:update-address.address-field.province')}
              defaultValue={defaultState.province}
              errorMessage={errors?.province}
              options={[dummyOption, ...homeRegions]}
              required
            />
          )}
          <InputSelect
            id="home-country"
            name="homeCountry"
            className="w-full sm:w-1/2"
            label={t('protected-renew:update-address.address-field.country')}
            autoComplete="country"
            defaultValue={defaultState.country}
            errorMessage={errors?.country}
            options={countries}
            onChange={homeCountryChangeHandler}
            required
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Update address click">
            {t('protected-renew:update-address.save-btn')}
          </Button>
          <ButtonLink id="back-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Update address click">
            {t('protected-renew:update-address.cancel-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

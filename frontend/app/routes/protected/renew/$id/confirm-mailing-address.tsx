import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { MailingAddressState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/.server/utils/postal-zip-code.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
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
  pageIdentifier: pageIds.protected.renew.confirmMailingAddress,
  pageTitleI18nKey: 'protected-renew:update-address.mailing-address.page-title',
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

  const mailingAddressInfo = state.mailingAddress
    ? {
        address: state.mailingAddress.address,
        city: state.mailingAddress.city,
        province: state.mailingAddress.province,
        postalCode: state.mailingAddress.postalCode,
        country: state.mailingAddress.country,
        apartment: state.mailingAddress.apartment,
      }
    : {
        address: state.clientApplication.contactInformation.mailingAddress,
        city: state.clientApplication.contactInformation.mailingCity,
        province: state.clientApplication.contactInformation.mailingProvince,
        postalCode: state.clientApplication.contactInformation.mailingPostalCode,
        country: state.clientApplication.contactInformation.mailingCountry,
        apartment: state.clientApplication.contactInformation.mailingApartment,
      };

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:update-address.mailing-address.page-title') }) };

  return {
    meta,
    defaultState: {
      ...mailingAddressInfo,
      isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress,
    },
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

  const mailingAddressSchema = z
    .object({
      address: z.string().trim().min(1, t('protected-renew:update-address.error-message.mailing-address.address-required')).max(30).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')),
      country: z.string().trim().min(1, t('protected-renew:update-address.error-message.mailing-address.country-required')),
      province: z.string().trim().min(1, t('protected-renew:update-address.error-message.mailing-address.province-required')).optional(),
      city: z.string().trim().min(1, t('protected-renew:update-address.error-message.mailing-address.city-required')).max(100).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')),
      postalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('protected-renew:update-address.error-message.characters-valid')).optional(),
      copyMailingAddress: z.boolean().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.country === CANADA_COUNTRY_ID || val.country === USA_COUNTRY_ID) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.mailing-address.province-required'), path: ['province'] });
        }
        if (!val.postalCode || validator.isEmpty(val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.mailing-address.postal-code-required'), path: ['postalCode'] });
        } else if (!isValidPostalCode(val.country, val.postalCode)) {
          const message = val.country === CANADA_COUNTRY_ID ? t('protected-renew:update-address.error-message.mailing-address.postal-code-valid') : t('protected-renew:update-address.error-message.mailing-address.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['postalCode'] });
        } else if (val.country === CANADA_COUNTRY_ID && val.province && !isValidCanadianPostalCode(val.province, val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.mailing-address.invalid-postal-code-for-province'), path: ['postalCode'] });
        }
      }

      if (val.country && val.country !== CANADA_COUNTRY_ID && val.postalCode && isValidPostalCode(CANADA_COUNTRY_ID, val.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:update-address.error-message.mailing-address.invalid-postal-code-for-country'), path: ['country'] });
      }
    })
    .transform((val) => ({
      ...val,
      mailingPostalCode: val.country && val.postalCode ? formatPostalCode(val.country, val.postalCode) : val.postalCode,
    })) satisfies z.ZodType<MailingAddressState>;

  const parsedDataResult = mailingAddressSchema.safeParse({
    address: String(formData.get('mailingAddress')),
    country: String(formData.get('mailingCountry')),
    province: formData.get('mailingProvince') ? String(formData.get('mailingProvince')) : undefined,
    city: String(formData.get('mailingCity')),
    postalCode: formData.get('mailingPostalCode') ? String(formData.get('mailingPostalCode')) : undefined,
    copyMailingAddress: formData.get('copyMailingAddress') === 'copy',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const mailingAddress = {
    address: parsedDataResult.data.address,
    city: parsedDataResult.data.city,
    country: parsedDataResult.data.country,
    postalCode: parsedDataResult.data.postalCode,
    province: parsedDataResult.data.province,
  };

  const homeAddress = parsedDataResult.data.copyMailingAddress
    ? {
        address: parsedDataResult.data.address,
        city: parsedDataResult.data.city,
        country: parsedDataResult.data.country,
        postalCode: parsedDataResult.data.postalCode,
        province: parsedDataResult.data.province,
      }
    : undefined;

  saveProtectedRenewState({
    params,
    session,
    state: {
      mailingAddress,
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.copyMailingAddress,
      ...(homeAddress && { homeAddress }), // Only include if homeAddress is defined
    },
  });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmMailingAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = useLoaderData<typeof loader>();
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.country);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState.isHomeAddressSameAsMailingAddress === true);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    address: 'mailing-address',
    province: 'mailing-province',
    country: 'mailing-country',
    city: 'mailing-city',
    postalCode: 'mailing-postal-code',
    copyMailingAddress: 'copy-mailing-address',
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

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions: InputOptionProps[] = mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id }));

  const dummyOption: InputOptionProps = { children: t('protected-renew:update-address.address-field.select-one'), value: '' };

  const postalCodeRequiredContries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const mailingPostalCodeRequired = postalCodeRequiredContries.includes(selectedMailingCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="space-y-6">
          <InputSanitizeField
            id="mailing-address"
            name="mailingAddress"
            className="w-full"
            label={t('protected-renew:update-address.address-field.mailing-address')}
            maxLength={30}
            helpMessagePrimary={t('protected-renew:update-address.address-field.address-note')}
            helpMessagePrimaryClassName="text-black"
            autoComplete="address-line1"
            defaultValue={defaultState.address}
            errorMessage={errors?.address}
            required
          />
          <div className="grid items-end gap-6 md:grid-cols-2">
            <InputSanitizeField
              id="mailing-city"
              name="mailingCity"
              className="w-full"
              label={t('protected-renew:update-address.address-field.city')}
              maxLength={100}
              autoComplete="address-level2"
              defaultValue={defaultState.city}
              errorMessage={errors?.city}
              required
            />
            <InputSanitizeField
              id="mailing-postal-code"
              name="mailingPostalCode"
              className="w-full"
              label={mailingPostalCodeRequired ? t('protected-renew:update-address.address-field.postal-code') : t('protected-renew:update-address.address-field.postal-code-optional')}
              maxLength={100}
              autoComplete="postal-code"
              defaultValue={defaultState.postalCode}
              errorMessage={errors?.postalCode}
              required={mailingPostalCodeRequired}
            />
          </div>
          {mailingRegions.length > 0 && (
            <InputSelect
              id="mailing-province"
              name="mailingProvince"
              className="w-full sm:w-1/2"
              label={t('protected-renew:update-address.address-field.province')}
              defaultValue={defaultState.province}
              errorMessage={errors?.province}
              options={[dummyOption, ...mailingRegions]}
              required
            />
          )}
          <InputSelect
            id="mailing-country"
            name="mailingCountry"
            className="w-full sm:w-1/2"
            label={t('protected-renew:update-address.address-field.country')}
            autoComplete="country"
            defaultValue={defaultState.country}
            errorMessage={errors?.country}
            options={countries}
            onChange={mailingCountryChangeHandler}
            required
          />
          <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" value="copy" checked={copyAddressChecked} onChange={checkHandler}>
            {t('protected-renew:update-address.home-address.use-mailing-address')}
          </InputCheckbox>
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

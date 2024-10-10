import { useEffect, useMemo, useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { DebugPayload } from '~/components/debug-payload';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { PublicLayout } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

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

export async function action({ context: { configProvider, session }, request }: ActionFunctionArgs) {
  featureEnabled('address-validation');

  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = configProvider.getServerConfig();

  const addressSchema = z
    .object({
      address: z.string().trim().min(1, t('address-validation:error-message.address-required')).max(30).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      apartment: z.string().trim().max(30).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')).optional(),
      country: z.string().trim().min(1, t('address-validation:error-message.country-required')),
      province: z.string().trim().min(1, t('address-validation:error-message.province-required')).optional(),
      city: z.string().trim().min(1, t('address-validation:error-message.city-required')).max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      postalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.country === CANADA_COUNTRY_ID || val.country === USA_COUNTRY_ID) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.province-required'), path: ['province'] });
        }
        if (!val.postalCode || validator.isEmpty(val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.postal-code-required'), path: ['postalCode'] });
        } else if (!isValidPostalCode(val.country, val.postalCode)) {
          const message = val.country === CANADA_COUNTRY_ID ? t('address-validation:error-message.postal-code-valid') : t('address-validation:error-message.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['postalCode'] });
        } else if (val.country === CANADA_COUNTRY_ID && val.province && !isValidCanadianPostalCode(val.province, val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.invalid-postal-code-for-province'), path: ['postalCode'] });
        }
      }

      if (val.country && val.country !== CANADA_COUNTRY_ID && val.postalCode && isValidPostalCode(CANADA_COUNTRY_ID, val.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.invalid-postal-code-for-country'), path: ['country'] });
      }
    })
    .transform((val) => ({
      ...val,
      postalCode: val.country && val.postalCode ? formatPostalCode(val.country, val.postalCode) : val.postalCode,
    }));

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    address: String(formData.get('address') ?? ''),
    apartment: formData.get('apartment') ? String(formData.get('apartment')) : undefined,
    country: String(formData.get('country') ?? ''),
    province: formData.get('province') ? String(formData.get('province')) : undefined,
    city: String(formData.get('city') ?? ''),
    postalCode: formData.get('postalCode') ? String(formData.get('postalCode')) : undefined,
  };

  const parsedDataResult = addressSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      status: 'error',
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    } as const);
  }

  return {
    status: 'valid-input',
    address: parsedDataResult.data,
  } as const;
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

  const errors = fetcher.data?.status === 'error' ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'address',
    apartment: 'apartment',
    province: 'province',
    country: 'country',
    city: 'city',
    postalCode: 'postal-code',
  });

  useEffect(() => {
    const filteredProvinceTerritoryStates = countryProvinceTerritoryStates.filter(({ countryId }) => {
      return countryId === selectedCountry;
    });
    setCountryProvinceTerritoryStates(filteredProvinceTerritoryStates);
  }, [selectedCountry, countryProvinceTerritoryStates]);

  const countryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
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
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('address-validation:address-header')}</legend>
            <div className="space-y-6">
              <InputSanitizeField
                id="address"
                name="address"
                className="w-full"
                label={t('address-validation:address-field.address')}
                maxLength={30}
                helpMessagePrimary={t('address-validation:address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue=""
                errorMessage={errors?.address}
                required
              />
              <InputSanitizeField id="apartment" name="apartment" className="w-full" label={t('address-validation:address-field.apartment')} maxLength={30} autoComplete="address-line2" defaultValue="" errorMessage={errors?.apartment} />
              <InputSelect
                id="country"
                name="country"
                className="w-full sm:w-1/2"
                label={t('address-validation:address-field.country')}
                autoComplete="country"
                defaultValue=""
                errorMessage={errors?.country}
                options={countryInputOptions}
                onChange={countryChangeHandler}
                required
              />
              {countryProvinceTerritoryStateInputOptions.length > 0 && (
                <InputSelect id="province" name="province" className="w-full sm:w-1/2" label={t('address-validation:address-field.province')} defaultValue="" errorMessage={errors?.province} options={countryProvinceTerritoryStateInputOptions} required />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField id="city" name="city" className="w-full" label={t('address-validation:address-field.city')} maxLength={100} autoComplete="address-level2" defaultValue="" errorMessage={errors?.city} required />
                <InputSanitizeField
                  id="postal-code"
                  name="postalCode"
                  className="w-full"
                  label={postalCodeRequired ? t('address-validation:address-field.postal-code') : t('address-validation:address-field.postal-code-optional')}
                  maxLength={100}
                  autoComplete="postal-code"
                  defaultValue=""
                  errorMessage={errors?.postalCode}
                  required={postalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          {fetcher.data?.status === 'valid-input' && (
            <div className="my-6">
              <DebugPayload data={fetcher.data.address} />
            </div>
          )}
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

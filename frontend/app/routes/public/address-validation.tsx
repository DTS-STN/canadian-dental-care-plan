import { useEffect, useMemo, useRef, useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faCheck, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import { Address } from '~/components/address';
import { AddressDiff } from '~/components/address-diff';
import { Button } from '~/components/buttons';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
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
import { isAllValidInputCharacters, randomString } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

interface CanadianAddress {
  postalZipCode: string;
  address: string;
  city: string;
  country: string;
  apartment?: string;
  provinceState: string;
}

interface InternationalAddress {
  postalZipCode?: string;
  address: string;
  city: string;
  country: string;
  apartment?: string;
  provinceState?: string;
}

interface CorrectedAddressResponse {
  status: 'corrected-address';
  address: CanadianAddress;
  correctedAddress: CanadianAddress;
}

interface InternationalAddressResponse {
  status: 'international-address';
  address: InternationalAddress;
}

interface NotCorrectAddressResponse {
  status: 'not-correct-address';
  address: CanadianAddress;
}

interface ValidAddressResponse {
  status: 'valid-address';
  address: CanadianAddress;
}

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

export async function action({ context: { configProvider, serviceProvider, session }, request }: ActionFunctionArgs) {
  featureEnabled('address-validation');

  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = configProvider.getServerConfig();
  const locale = getLocale(request);

  const addressSchema = z
    .object({
      address: z.string().trim().min(1, t('address-validation:error-message.address-required')).max(30).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      apartment: z.string().trim().max(30).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')).optional(),
      country: z.string().trim().min(1, t('address-validation:error-message.country-required')),
      provinceState: z.string().trim().min(1, t('address-validation:error-message.province-state-required')).optional(),
      city: z.string().trim().min(1, t('address-validation:error-message.city-required')).max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      postalZipCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.country === CANADA_COUNTRY_ID || val.country === USA_COUNTRY_ID) {
        if (!val.provinceState || validator.isEmpty(val.provinceState)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.province-state-required'), path: ['province'] });
        }
        if (!val.postalZipCode || validator.isEmpty(val.postalZipCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.postal-zip-code-required'), path: ['postalZipCode'] });
        } else if (!isValidPostalCode(val.country, val.postalZipCode)) {
          const message = val.country === CANADA_COUNTRY_ID ? t('address-validation:error-message.postal-zip-code-valid') : t('address-validation:error-message.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['postalZipCode'] });
        } else if (val.country === CANADA_COUNTRY_ID && val.provinceState && !isValidCanadianPostalCode(val.provinceState, val.postalZipCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.invalid-postal-zip-code-for-province'), path: ['postalZipCode'] });
        }
      }

      if (val.country && val.country !== CANADA_COUNTRY_ID && val.postalZipCode && isValidPostalCode(CANADA_COUNTRY_ID, val.postalZipCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.invalid-postal-zip-code-for-country'), path: ['country'] });
      }
    })
    .transform((val) => ({
      ...val,
      postalZipCode: val.country && val.postalZipCode ? formatPostalCode(val.country, val.postalZipCode) : val.postalZipCode,
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
    city: String(formData.get('city') ?? ''),
    country: String(formData.get('country') ?? ''),
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
    provinceState: formData.get('province') ? String(formData.get('province')) : undefined,
  };

  const parsedDataResult = addressSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  const parsedData = parsedDataResult.data;
  const resolvedAddress = {
    address: parsedData.address,
    apartment: parsedData.apartment,
    city: parsedData.city,
    country: serviceProvider.getCountryService().getLocalizedCountryById(parsedData.country, locale).name,
    postalZipCode: parsedData.postalZipCode,
    provinceState: parsedData.provinceState && serviceProvider.getProvinceTerritoryStateService().getLocalizedProvinceTerritoryStateById(parsedData.provinceState, locale).abbr,
  };

  // International address, skip validation
  if (parsedData.country !== CANADA_COUNTRY_ID) {
    return {
      status: 'international-address',
      address: resolvedAddress,
    } as const satisfies InternationalAddressResponse;
  }

  // Validate Canadian adddress
  invariant(resolvedAddress.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(resolvedAddress.provinceState, 'Province state is required for Canadian addresses');

  const canadianAddress: CanadianAddress = {
    ...resolvedAddress,
    postalZipCode: resolvedAddress.postalZipCode,
    provinceState: resolvedAddress.provinceState,
  };

  const addressCorrectionResult = await serviceProvider.getAddressValidationService().getAddressCorrectionResult({
    address: resolvedAddress.address,
    city: resolvedAddress.city,
    postalCode: resolvedAddress.postalZipCode,
    provinceCode: resolvedAddress.provinceState,
  });

  if (addressCorrectionResult.status === 'NotCorrect') {
    return { status: 'not-correct-address', address: canadianAddress } as const satisfies NotCorrectAddressResponse;
  }

  if (addressCorrectionResult.status === 'Corrected') {
    return {
      status: 'corrected-address',
      address: canadianAddress,
      correctedAddress: {
        address: addressCorrectionResult.address,
        apartment: canadianAddress.apartment,
        city: addressCorrectionResult.city,
        country: canadianAddress.country,
        postalZipCode: formatPostalCode(CANADA_COUNTRY_ID, addressCorrectionResult.postalCode),
        provinceState: addressCorrectionResult.provinceCode,
      },
    } as const satisfies CorrectedAddressResponse;
  }

  return { status: 'valid-address', address: canadianAddress } as const satisfies ValidAddressResponse;
}

export default function AddressValidationRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, countries, csrfToken, provinceTerritoryStates, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const formElementRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(randomString(16));
  const fetcher = useFetcher<typeof action>({ key: formKey });
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedCountry, setSelectedCountry] = useState(CANADA_COUNTRY_ID);
  const [countryProvinceTerritoryStates, setCountryProvinceTerritoryStates] = useState(() => {
    return provinceTerritoryStates.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);
  });
  const [addressDialogContent, setAddressDialogContent] = useState<CorrectedAddressResponse | InternationalAddressResponse | NotCorrectAddressResponse | ValidAddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'address',
    apartment: 'apartment',
    city: 'city',
    country: 'country',
    postalZipCode: 'postal-zip-code',
    provinceState: 'province-state',
  });

  useEffect(() => {
    setAddressDialogContent(fetcher.data && 'status' in fetcher.data ? fetcher.data : null);
  }, [fetcher.data]);

  function onCountryChangeHandler(event: React.SyntheticEvent<HTMLSelectElement>) {
    setSelectedCountry(event.currentTarget.value);
  }

  useEffect(() => {
    setCountryProvinceTerritoryStates(provinceTerritoryStates.filter(({ countryId }) => countryId === selectedCountry));
  }, [provinceTerritoryStates, selectedCountry]);

  function onDialogOpenChangeHandler(open: boolean) {
    if (open) {
      submitForm();
    } else {
      closeDialog();
    }
  }

  function closeDialog() {
    setAddressDialogContent(null);
  }

  function submitForm() {
    if (formElementRef.current) {
      fetcher.submit(formElementRef.current, { method: 'post' });
    }
  }

  function onResetClickHandler(event: React.SyntheticEvent<HTMLButtonElement>) {
    event.preventDefault();
    setFormKey(randomString(16));
    document.getElementById('h1#wb-cont')?.focus();
    const headingElement = document.querySelector<HTMLElement>('h1#wb-cont');
    headingElement?.scrollIntoView({ behavior: 'smooth' });
    headingElement?.focus();
  }

  const countryInputOptions = useMemo<InputOptionProps[]>(() => {
    return countries.map(({ id, name }) => ({ children: name, value: id }));
  }, [countries]);

  const countryProvinceTerritoryStateInputOptions: InputOptionProps[] = useMemo<InputOptionProps[]>(() => {
    return countryProvinceTerritoryStates.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryProvinceTerritoryStates]);

  const postalZipCodeRequiredCountries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const isPostalCodeRequired = postalZipCodeRequiredCountries.includes(selectedCountry);

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('address-validation:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form ref={formElementRef} method="post" noValidate>
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
                onChange={onCountryChangeHandler}
                required
              />
              {countryProvinceTerritoryStateInputOptions.length > 0 && (
                <InputSelect
                  id="province"
                  name="province"
                  className="w-full sm:w-1/2"
                  label={t('address-validation:address-field.province-state')}
                  defaultValue=""
                  errorMessage={errors?.provinceState}
                  options={countryProvinceTerritoryStateInputOptions}
                  required
                />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField id="city" name="city" className="w-full" label={t('address-validation:address-field.city')} maxLength={100} autoComplete="address-level2" defaultValue="" errorMessage={errors?.city} required />
                <InputSanitizeField
                  id="postal-zip-code"
                  name="postalZipCode"
                  className="w-full"
                  label={isPostalCodeRequired ? t('address-validation:address-field.postal-zip-code') : t('address-validation:address-field.postal-zip-code-optional')}
                  maxLength={100}
                  autoComplete="postal-zip-code"
                  defaultValue=""
                  errorMessage={errors?.postalZipCode}
                  required={isPostalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
              <DialogTrigger asChild>
                <LoadingButton variant="primary" id="submit-button" loading={isSubmitting} endIcon={faCheck}>
                  {t('address-validation:submit-button')}
                </LoadingButton>
              </DialogTrigger>
              {addressDialogContent && addressDialogContent.status === 'corrected-address' && <CorrectedAddressDialogContent address={addressDialogContent.address} correctedAddress={addressDialogContent.correctedAddress} />}
              {addressDialogContent && addressDialogContent.status === 'international-address' && <InternationalAddressDialogContent address={addressDialogContent.address} />}
              {addressDialogContent && addressDialogContent.status === 'not-correct-address' && <NotCorrectAddressDialogContent address={addressDialogContent.address} />}
              {addressDialogContent && addressDialogContent.status === 'valid-address' && <ValidAddressDialogContent address={addressDialogContent.address} />}
            </Dialog>
            <Button id="reset-button" endIcon={faRefresh} onClick={onResetClickHandler}>
              {t('address-validation:reset-button')}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </PublicLayout>
  );
}

interface CorrectedAddressDialogContentProps {
  address: CanadianAddress;
  correctedAddress: CanadianAddress;
}

function CorrectedAddressDialogContent({ address, correctedAddress }: CorrectedAddressDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:dialog.corrected-address.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:dialog.corrected-address.description')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <p className="font-semibold">{t('address-validation:dialog.corrected-address.initial-address')}</p>
        <Address address={address} />
        <p className="font-semibold">{t('address-validation:dialog.corrected-address.corrected-address')}</p>
        <AddressDiff oldAddress={address} newAddress={correctedAddress} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.corrected-address-close-button" variant="default" size="sm">
            {t('address-validation:dialog.corrected-address.close-button')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

interface InternationalAddressDialogContentProps {
  address: InternationalAddress;
}

function InternationalAddressDialogContent({ address }: InternationalAddressDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:dialog.international-address.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:dialog.international-address.description')}</DialogDescription>
      </DialogHeader>
      <Address address={address} />
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.international-address-close-button" variant="default" size="sm">
            {t('address-validation:dialog.international-address.close-button')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

interface NotCorrectAddressDialogContentProps {
  address: CanadianAddress;
}

function NotCorrectAddressDialogContent({ address }: NotCorrectAddressDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:dialog.not-correct-address.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:dialog.not-correct-address.description')}</DialogDescription>
      </DialogHeader>
      <Address address={address} />
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.not-correct-address-close-button" variant="default" size="sm">
            {t('address-validation:dialog.not-correct-address.close-button')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

interface ValidAddressDialogContentProps {
  address: CanadianAddress;
}

function ValidAddressDialogContent({ address }: ValidAddressDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:dialog.valid-address.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:dialog.valid-address.description')}</DialogDescription>
      </DialogHeader>
      <Address address={address} />
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.valid-address-close-button" variant="default" size="sm">
            {t('address-validation:dialog.valid-address.close-button')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

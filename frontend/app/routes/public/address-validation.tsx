import { useEffect, useMemo, useRef, useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { faCheck, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { validateCsrfToken } from '~/.server/remix/security';
import { Address } from '~/components/address';
import { Button } from '~/components/buttons';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { PublicLayout } from '~/components/layouts/public-layout';
import { LoadingButton } from '~/components/loading-button';
import { useEnhancedFetcher, useFetcherKey } from '~/hooks';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

interface CanadianAddress {
  postalZipCode: string;
  address: string;
  city: string;
  country: string;
  provinceState: string;
}

interface InternationalAddress {
  postalZipCode?: string;
  address: string;
  city: string;
  country: string;
  provinceState?: string;
}

interface AddressSuggestionResponse {
  status: 'address-suggestion';
  enteredAddress: CanadianAddress;
  suggestedAddress: CanadianAddress;
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

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  featureEnabled('address-validation');
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);

  const locale = getLocale(request);
  const countries = appContainer.get(SERVICE_IDENTIFIER.COUNTRY_SERVICE).listAndSortLocalizedCountries(locale);
  const provinceTerritoryStates = appContainer.get(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).listAndSortLocalizedProvinceTerritoryStates(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:page-title') }) };

  return {
    CANADA_COUNTRY_ID,
    countries,
    meta,
    provinceTerritoryStates,
    USA_COUNTRY_ID,
  };
}

export async function action({ context: { appContainer, session }, request }: ActionFunctionArgs) {
  featureEnabled('address-validation');
  await validateCsrfToken({ context: { appContainer }, request });

  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const locale = getLocale(request);

  const addressSchema = z
    .object({
      address: z.string().trim().min(1, t('address-validation:error-message.address-required')).max(30).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      country: z.string().trim().min(1, t('address-validation:error-message.country-required')),
      provinceState: z.string().trim().min(1, t('address-validation:error-message.province-state-required')).optional(),
      city: z.string().trim().min(1, t('address-validation:error-message.city-required')).max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')),
      postalZipCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('address-validation:error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.country === CANADA_COUNTRY_ID || val.country === USA_COUNTRY_ID) {
        if (!val.provinceState || validator.isEmpty(val.provinceState)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('address-validation:error-message.province-state-required'), path: ['provinceState'] });
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
  const data = {
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    country: String(formData.get('country') ?? ''),
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
    provinceState: formData.get('provinceState') ? String(formData.get('provinceState')) : undefined,
  };

  const parsedDataResult = addressSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  const parsedData = parsedDataResult.data;
  const resolvedAddress = {
    address: parsedData.address,
    city: parsedData.city,
    country: appContainer.get(SERVICE_IDENTIFIER.COUNTRY_SERVICE).getLocalizedCountryById(parsedData.country, locale).name,
    postalZipCode: parsedData.postalZipCode,
    provinceState: parsedData.provinceState && appContainer.get(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).getLocalizedProvinceTerritoryStateById(parsedData.provinceState, locale).abbr,
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

  const addressCorrectionResult = await appContainer.get(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE).getAddressCorrectionResult({
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
      status: 'address-suggestion',
      enteredAddress: canadianAddress,
      suggestedAddress: {
        address: addressCorrectionResult.address,
        city: addressCorrectionResult.city,
        country: canadianAddress.country,
        postalZipCode: formatPostalCode(CANADA_COUNTRY_ID, addressCorrectionResult.postalCode),
        provinceState: addressCorrectionResult.provinceCode,
      },
    } as const satisfies AddressSuggestionResponse;
  }

  return { status: 'valid-address', address: canadianAddress } as const satisfies ValidAddressResponse;
}

export default function AddressValidationRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, countries, provinceTerritoryStates, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const formElementRef = useRef<HTMLFormElement>(null);
  const fetcherKey = useFetcherKey();
  const fetcher = useEnhancedFetcher<typeof action>({ key: fetcherKey.key });

  const [countryProvinceTerritoryStates, setCountryProvinceTerritoryStates] = useState(() => {
    return provinceTerritoryStates.filter(({ countryId }) => countryId === CANADA_COUNTRY_ID);
  });
  const [countryValue, setCountryValue] = useState(CANADA_COUNTRY_ID);
  const [addressValue, setAddressValue] = useState('');
  const [provinceStateValue, setProvinceStateValue] = useState('');
  const [cityValue, setCityValue] = useState('');
  const [postalZipCodeValue, setPostalZipCodeValue] = useState('');

  type AddressDialogContentState = AddressSuggestionResponse | InternationalAddressResponse | NotCorrectAddressResponse | ValidAddressResponse | null;
  const [addressDialogContent, setAddressDialogContent] = useState<AddressDialogContentState>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'address',
    city: 'city',
    country: 'country',
    postalZipCode: 'postal-zip-code',
    provinceState: 'province-state',
  });

  useEffect(() => {
    setAddressDialogContent(fetcher.data && 'status' in fetcher.data ? fetcher.data : null);
  }, [fetcher.data]);

  useEffect(() => {
    setCountryProvinceTerritoryStates(provinceTerritoryStates.filter(({ countryId }) => countryId === countryValue));
  }, [provinceTerritoryStates, countryValue]);

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
    setCountryValue(CANADA_COUNTRY_ID);
    setAddressValue('');
    setProvinceStateValue('');
    setCityValue('');
    setPostalZipCodeValue('');
    setAddressDialogContent(null);
    fetcherKey.reset();

    const headingElement = document.querySelector<HTMLElement>('h1#wb-cont');
    headingElement?.scrollIntoView({ behavior: 'smooth' });
    headingElement?.focus();
  }

  function onCorrectedAddressDialogAddressSelectedHandler(address: CanadianAddress) {
    setAddressValue(address.address);
    setCityValue(address.city);
    setPostalZipCodeValue(address.postalZipCode);
    const provinceTerritoryState = provinceTerritoryStates.find(({ abbr }) => abbr === address.provinceState);
    setProvinceStateValue(provinceTerritoryState?.id ?? '');
    setAddressDialogContent(null);
  }

  const countryInputOptions = useMemo<InputOptionProps[]>(() => {
    return countries.map(({ id, name }) => ({ children: name, value: id }));
  }, [countries]);

  const countryProvinceTerritoryStateInputOptions: InputOptionProps[] = useMemo<InputOptionProps[]>(() => {
    return countryProvinceTerritoryStates.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryProvinceTerritoryStates]);

  const postalZipCodeRequiredCountries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const isPostalCodeRequired = postalZipCodeRequiredCountries.includes(countryValue);

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('address-validation:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form ref={formElementRef} method="post" noValidate>
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
                value={addressValue}
                onChange={(e) => {
                  setAddressValue(e.target.value);
                }}
                errorMessage={errors?.address}
                required
              />
              <InputSelect
                id="country"
                name="country"
                className="w-full sm:w-1/2"
                label={t('address-validation:address-field.country')}
                autoComplete="country"
                value={countryValue}
                onChange={(e) => {
                  setCountryValue(e.target.value);
                }}
                errorMessage={errors?.country}
                options={countryInputOptions}
                required
              />
              {countryProvinceTerritoryStateInputOptions.length > 0 && (
                <InputSelect
                  id="province-state"
                  name="provinceState"
                  className="w-full sm:w-1/2"
                  label={t('address-validation:address-field.province-state')}
                  value={provinceStateValue}
                  onChange={(e) => {
                    setProvinceStateValue(e.target.value);
                  }}
                  errorMessage={errors?.provinceState}
                  options={countryProvinceTerritoryStateInputOptions}
                  required
                />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField
                  id="city"
                  name="city"
                  className="w-full"
                  label={t('address-validation:address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  value={cityValue}
                  onChange={(e) => {
                    setCityValue(e.target.value);
                  }}
                  errorMessage={errors?.city}
                  required
                />
                <InputSanitizeField
                  id="postal-zip-code"
                  name="postalZipCode"
                  className="w-full"
                  label={isPostalCodeRequired ? t('address-validation:address-field.postal-zip-code') : t('address-validation:address-field.postal-zip-code-optional')}
                  maxLength={100}
                  autoComplete="postal-zip-code"
                  value={postalZipCodeValue}
                  onChange={(e) => {
                    setPostalZipCodeValue(e.target.value);
                  }}
                  errorMessage={errors?.postalZipCode}
                  required={isPostalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
              <DialogTrigger asChild>
                <LoadingButton variant="primary" id="submit-button" loading={fetcher.isSubmitting} endIcon={faCheck}>
                  {t('address-validation:submit-button')}
                </LoadingButton>
              </DialogTrigger>
              {addressDialogContent && addressDialogContent.status === 'address-suggestion' && (
                <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} onAddressSuggestionSelected={onCorrectedAddressDialogAddressSelectedHandler} />
              )}
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

interface AddressSuggestionDialogContentProps {
  enteredAddress: CanadianAddress;
  onAddressSuggestionSelected: (selectedAddress: CanadianAddress) => void;
  suggestedAddress: CanadianAddress;
}

function AddressSuggestionDialogContent({ enteredAddress, suggestedAddress, onAddressSuggestionSelected }: AddressSuggestionDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const enteredAddressOptionValue = 'entered-address';
  const suggestedAddressOptionValue = 'suggested-address';
  type AddressSelectionOption = typeof enteredAddressOptionValue | typeof suggestedAddressOptionValue;
  const [selectedAddressSuggestionOption, setSelectedAddressSuggestionOption] = useState<AddressSelectionOption>(enteredAddressOptionValue);

  function onUseSelectedAddressButtonClickHandler() {
    const selectedAddressSuggestion = selectedAddressSuggestionOption === enteredAddressOptionValue ? enteredAddress : suggestedAddress;
    onAddressSuggestionSelected(selectedAddressSuggestion);
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:dialog.address-suggestion.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:dialog.address-suggestion.description')}</DialogDescription>
      </DialogHeader>
      <InputRadios
        id="addressSelection"
        name="addressSelection"
        legend={t('address-validation:dialog.address-suggestion.address-selection-legend')}
        options={[
          {
            value: enteredAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('address-validation:dialog.address-suggestion.entered-address-option')}</p>
                <Address address={enteredAddress} />
              </>
            ),
          },
          {
            value: suggestedAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('address-validation:dialog.address-suggestion.suggested-address-option')}</p>
                <Address address={suggestedAddress} />
              </>
            ),
          },
        ].map((option) => ({
          ...option,
          onChange: (e) => {
            setSelectedAddressSuggestionOption(e.target.value as AddressSelectionOption);
          },
          checked: option.value === selectedAddressSuggestionOption,
        }))}
      />

      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.corrected-address-close-button" variant="default" size="sm">
            {t('address-validation:dialog.address-suggestion.cancel-button')}
          </Button>
        </DialogClose>
        <Button id="dialog.corrected-address-use-selected-address-button" variant="primary" size="sm" onClick={onUseSelectedAddressButtonClickHandler}>
          {t('address-validation:dialog.address-suggestion.use-selected-address-button')}
        </Button>
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

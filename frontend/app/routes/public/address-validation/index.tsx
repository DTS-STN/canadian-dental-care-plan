import { useEffect, useMemo, useRef, useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect, useLoaderData } from '@remix-run/react';

import { faCheck, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { MailingAddressValidator } from '~/.server/remix/domain/routes/address-validation/mailing-address.validator';
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
import { useEnhancedFetcher } from '~/hooks';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode } from '~/utils/postal-zip-code-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

interface CanadianAddress {
  postalZipCode: string;
  address: string;
  city: string;
  country: string;
  provinceState: string;
}

interface AddressSuggestionResponse {
  status: 'address-suggestion';
  enteredAddress: CanadianAddress;
  suggestedAddress: CanadianAddress;
}

interface NotCorrectAddressResponse {
  status: 'not-correct-address';
  address: CanadianAddress;
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('address-validation', 'gcweb'),
  pageTitleI18nKey: 'address-validation:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  featureEnabled('address-validation');
  const serverConfig = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = serverConfig;

  const mailingAddressValidator = new MailingAddressValidator(getLocale(request), appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG));
  const validationResult = await mailingAddressValidator.validateMailingAddress(session.get('route.address-validation'));
  const defaultMailingAddress = validationResult.success ? validationResult.data : undefined;

  const locale = getLocale(request);
  const countries = appContainer.get(SERVICE_IDENTIFIER.COUNTRY_SERVICE).listAndSortLocalizedCountries(locale);
  const provinceTerritoryStates = appContainer.get(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).listAndSortLocalizedProvinceTerritoryStates(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:index.page-title') }) };

  return {
    CANADA_COUNTRY_ID,
    countries,
    defaultMailingAddress,
    meta,
    provinceTerritoryStates,
    USA_COUNTRY_ID,
  };
}

export async function action({ context: { appContainer, session }, request, params }: ActionFunctionArgs) {
  featureEnabled('address-validation');
  await validateCsrfToken({ context: { appContainer }, request });

  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const serverConfig = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const locale = getLocale(request);

  const mailingAddressValidator = new MailingAddressValidator(locale, serverConfig);
  const formData = await request.formData();
  const validatedResult = await mailingAddressValidator.validateMailingAddress({
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    country: String(formData.get('country') ?? ''),
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
    provinceState: formData.get('provinceState') ? String(formData.get('provinceState')) : undefined,
  });

  if (!validatedResult.success) {
    return json({ errors: validatedResult.errors });
  }

  const validatedMailingAddress = validatedResult.data;

  // International address, go to review page
  if (validatedMailingAddress.country !== serverConfig.CANADA_COUNTRY_ID) {
    session.set('route.address-validation', validatedMailingAddress);
    return redirect(getPathById('public/address-validation/review', params));
  }

  // Validate Canadian adddress
  invariant(validatedMailingAddress.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedMailingAddress.provinceState, 'Province state is required for Canadian addresses');

  // Build the address object using validated data, transforming unique identifiers
  // for country and province/state into localized names for rendering on the screen.
  // The localized country and province/state names are retrieved based on the user's locale.
  const formattedMailingAddress: CanadianAddress = {
    address: validatedMailingAddress.address,
    city: validatedMailingAddress.city,
    country: appContainer.get(SERVICE_IDENTIFIER.COUNTRY_SERVICE).getLocalizedCountryById(validatedMailingAddress.country, locale).name,
    postalZipCode: validatedMailingAddress.postalZipCode,
    provinceState: validatedMailingAddress.provinceState && appContainer.get(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).getLocalizedProvinceTerritoryStateById(validatedMailingAddress.provinceState, locale).abbr,
  };

  const addressCorrectionResult = await appContainer.get(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_SERVICE).getAddressCorrectionResult({
    address: formattedMailingAddress.address,
    city: formattedMailingAddress.city,
    postalCode: formattedMailingAddress.postalZipCode,
    provinceCode: formattedMailingAddress.provinceState,
    userId: 'anonymous',
  });

  if (addressCorrectionResult.status === 'NotCorrect') {
    return {
      status: 'not-correct-address',
      address: formattedMailingAddress,
    } as const satisfies NotCorrectAddressResponse;
  }

  if (addressCorrectionResult.status === 'Corrected') {
    return {
      status: 'address-suggestion',
      enteredAddress: formattedMailingAddress,
      suggestedAddress: {
        address: addressCorrectionResult.address,
        city: addressCorrectionResult.city,
        country: formattedMailingAddress.country,
        postalZipCode: formatPostalCode(serverConfig.CANADA_COUNTRY_ID, addressCorrectionResult.postalCode),
        provinceState: addressCorrectionResult.provinceCode,
      },
    } as const satisfies AddressSuggestionResponse;
  }

  session.set('route.address-validation', validatedMailingAddress);
  return redirect(getPathById('public/address-validation/review', params));
}

export default function AddressValidationIndexRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, countries, defaultMailingAddress, provinceTerritoryStates, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const formElementRef = useRef<HTMLFormElement>(null);
  const fetcher = useEnhancedFetcher<typeof action>();

  const [countryProvinceTerritoryStates, setCountryProvinceTerritoryStates] = useState(() => {
    return provinceTerritoryStates.filter(({ countryId }) => countryId === (defaultMailingAddress?.country ?? CANADA_COUNTRY_ID));
  });
  const [countryValue, setCountryValue] = useState(defaultMailingAddress?.country ?? CANADA_COUNTRY_ID);
  const [addressValue, setAddressValue] = useState(defaultMailingAddress?.address ?? '');
  const [provinceStateValue, setProvinceStateValue] = useState(defaultMailingAddress?.provinceState ?? '');
  const [cityValue, setCityValue] = useState(defaultMailingAddress?.city ?? '');
  const [postalZipCodeValue, setPostalZipCodeValue] = useState(defaultMailingAddress?.postalZipCode ?? '');

  type AddressDialogContentState = AddressSuggestionResponse | NotCorrectAddressResponse | null;
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
    fetcher.reset();

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
        <p className="mb-4 italic">{t('address-validation:index.optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form ref={formElementRef} method="post" noValidate>
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('address-validation:index.address-header')}</legend>
            <div className="space-y-6">
              <InputSanitizeField
                id="address"
                name="address"
                className="w-full"
                label={t('address-validation:index.address-field.address')}
                maxLength={30}
                helpMessagePrimary={t('address-validation:index.address-field.address-note')}
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
                label={t('address-validation:index.address-field.country')}
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
                  label={t('address-validation:index.address-field.province-state')}
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
                  label={t('address-validation:index.address-field.city')}
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
                  label={isPostalCodeRequired ? t('address-validation:index.address-field.postal-zip-code') : t('address-validation:index.address-field.postal-zip-code-optional')}
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
                  {t('address-validation:index.submit-button')}
                </LoadingButton>
              </DialogTrigger>
              {addressDialogContent && addressDialogContent.status === 'address-suggestion' && (
                <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} onAddressSuggestionSelected={onCorrectedAddressDialogAddressSelectedHandler} />
              )}
              {addressDialogContent && addressDialogContent.status === 'not-correct-address' && <NotCorrectAddressDialogContent address={addressDialogContent.address} />}
            </Dialog>
            <Button id="reset-button" endIcon={faRefresh} onClick={onResetClickHandler}>
              {t('address-validation:index.reset-button')}
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
        <DialogTitle>{t('address-validation:index.dialog.address-suggestion.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:index.dialog.address-suggestion.description')}</DialogDescription>
      </DialogHeader>
      <InputRadios
        id="addressSelection"
        name="addressSelection"
        legend={t('address-validation:index.dialog.address-suggestion.address-selection-legend')}
        options={[
          {
            value: enteredAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('address-validation:index.dialog.address-suggestion.entered-address-option')}</p>
                <Address address={enteredAddress} />
              </>
            ),
          },
          {
            value: suggestedAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('address-validation:index.dialog.address-suggestion.suggested-address-option')}</p>
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
            {t('address-validation:index.dialog.address-suggestion.cancel-button')}
          </Button>
        </DialogClose>
        <Button id="dialog.corrected-address-use-selected-address-button" variant="primary" size="sm" onClick={onUseSelectedAddressButtonClickHandler}>
          {t('address-validation:index.dialog.address-suggestion.use-selected-address-button')}
        </Button>
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
        <DialogTitle>{t('address-validation:index.dialog.not-correct-address.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:index.dialog.not-correct-address.description')}</DialogDescription>
      </DialogHeader>
      <Address address={address} />
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.not-correct-address-close-button" variant="default" size="sm">
            {t('address-validation:index.dialog.not-correct-address.close-button')}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

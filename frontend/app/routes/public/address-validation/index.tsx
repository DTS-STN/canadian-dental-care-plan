import type { SyntheticEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { redirect } from 'react-router';

import { faCheck, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
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
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  submit: 'submit',
  useInvalidAddress: 'use-invalid-address',
  useSelectedAddress: 'use-selected-address',
} as const;

interface CanadianAddress {
  address: string;
  city: string;
  country: string;
  countryId: string;
  postalZipCode: string;
  provinceState: string;
  provinceStateId: string;
}

interface AddressSuggestionResponse {
  enteredAddress: CanadianAddress;
  status: 'address-suggestion';
  suggestedAddress: CanadianAddress;
}

interface AddressInvalidResponse {
  invalidAddress: CanadianAddress;
  status: 'address-invalid';
}

type AddressResponse = AddressSuggestionResponse | AddressInvalidResponse;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('address-validation', 'gcweb'),
  pageTitleI18nKey: 'address-validation:index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('address-validation');

  const locale = getLocale(request);
  const mailingAddressValidator = appContainer.get(TYPES.routes.validators.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
  const validationResult = await mailingAddressValidator.validateMailingAddress(session.find('route.address-validation') ?? {});
  const defaultMailingAddress = validationResult.success ? validationResult.data : undefined;

  const countries = appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const provinceTerritoryStates = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:index.page-title') }) };

  return { countries, defaultMailingAddress, meta, provinceTerritoryStates };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('address-validation');
  securityHandler.validateRequestMethod({ request, allowedMethods: ['POST'] });
  securityHandler.validateCsrfToken({ formData, session });

  const clientConfig = appContainer.get(TYPES.configs.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.domain.services.AddressValidationService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);
  const locale = getLocale(request);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  const mailingAddressValidator = appContainer.get(TYPES.routes.validators.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
  const validatedResult = await mailingAddressValidator.validateMailingAddress({
    address: formData.get('address') ? String(formData.get('address')) : undefined,
    city: formData.get('city') ? String(formData.get('city')) : undefined,
    countryId: formData.get('countryId') ? String(formData.get('countryId')) : undefined,
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
    provinceStateId: formData.get('provinceStateId') ? String(formData.get('provinceStateId')) : undefined,
  });

  if (!validatedResult.success) {
    return { errors: validatedResult.errors };
  }

  const validatedMailingAddress = validatedResult.data;

  const isNotCanada = validatedMailingAddress.countryId !== clientConfig.CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === 'use-invalid-address';
  const isUseSelectedAddressAction = formAction === 'use-selected-address';
  const canProceedToReview = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToReview) {
    session.set('route.address-validation', validatedMailingAddress);
    return redirect(getPathById('public/address-validation/review', params));
  }

  // Validate Canadian adddress
  invariant(validatedMailingAddress.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedMailingAddress.provinceStateId, 'Province state is required for Canadian addresses');

  // Build the address object using validated data, transforming unique identifiers
  // for country and province/state into localized names for rendering on the screen.
  // The localized country and province/state names are retrieved based on the user's locale.
  const formattedMailingAddress: CanadianAddress = {
    address: validatedMailingAddress.address,
    city: validatedMailingAddress.city,
    countryId: validatedMailingAddress.countryId,
    country: countryService.getLocalizedCountryById(validatedMailingAddress.countryId, locale).name,
    postalZipCode: validatedMailingAddress.postalZipCode,
    provinceStateId: validatedMailingAddress.provinceStateId,
    provinceState: validatedMailingAddress.provinceStateId && provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(validatedMailingAddress.provinceStateId, locale).abbr,
  };

  const addressCorrectionResult = await addressValidationService.getAddressCorrectionResult({
    address: formattedMailingAddress.address,
    city: formattedMailingAddress.city,
    postalCode: formattedMailingAddress.postalZipCode,
    provinceCode: formattedMailingAddress.provinceState,
    userId: 'anonymous',
  });

  if (addressCorrectionResult.status === 'not-correct') {
    return {
      invalidAddress: formattedMailingAddress,
      status: 'address-invalid',
    } as const satisfies AddressInvalidResponse;
  }

  if (addressCorrectionResult.status === 'corrected') {
    const provinceTerritoryState = provinceTerritoryStateService.getLocalizedProvinceTerritoryStateByCode(addressCorrectionResult.provinceCode, locale);
    return {
      enteredAddress: formattedMailingAddress,
      status: 'address-suggestion',
      suggestedAddress: {
        address: addressCorrectionResult.address,
        city: addressCorrectionResult.city,
        country: formattedMailingAddress.country,
        countryId: formattedMailingAddress.countryId,
        postalZipCode: addressCorrectionResult.postalCode,
        provinceState: provinceTerritoryState.abbr,
        provinceStateId: provinceTerritoryState.id,
      },
    } as const satisfies AddressSuggestionResponse;
  }

  session.set('route.address-validation', validatedMailingAddress);
  return redirect(getPathById('public/address-validation/review', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return (
    // Ensure status is a string
    // Ensure 'status' exists on data
    typeof data === 'object' && // Ensure it's an object
    data !== null && // Ensure it's not null
    'status' in data &&
    typeof data.status === 'string'
  );
}

export default function AddressValidationIndexRoute({ loaderData, params }: Route.ComponentProps) {
  const { countries, defaultMailingAddress, provinceTerritoryStates } = loaderData;

  const { t } = useTranslation(handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();
  const fetcher = useEnhancedFetcher<typeof action>();

  const [countryValue, setCountryValue] = useState(CANADA_COUNTRY_ID);
  const countryProvinceTerritoryStates = useMemo(() => {
    return provinceTerritoryStates.filter(({ countryId }) => countryId === countryValue);
  }, [provinceTerritoryStates, countryValue]);

  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'address',
    countryId: 'country',
    provinceStateId: 'province-state',
    city: 'city',
    postalZipCode: 'postal-zip-code',
  });

  useEffect(() => {
    setAddressDialogContent(isAddressResponse(fetcher.data) ? fetcher.data : null);
  }, [fetcher.data]);

  function onDialogOpenChangeHandler(open: boolean) {
    if (!open) {
      setAddressDialogContent(null);
    }
  }

  function onResetClickHandler(event: React.SyntheticEvent<HTMLButtonElement>) {
    event.preventDefault();
    setCountryValue(CANADA_COUNTRY_ID);
    setAddressDialogContent(null);
    fetcher.reset();

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
  const isPostalCodeRequired = postalZipCodeRequiredCountries.includes(countryValue);

  return (
    <PublicLayout>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('address-validation:index.optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <fieldset className="mb-6">
            <legend className="font-lato mb-4 text-2xl font-bold">{t('address-validation:index.address-header')}</legend>
            <div className="space-y-6">
              <InputSanitizeField
                id="address"
                name="address"
                className="w-full"
                label={t('address-validation:index.address-field.address')}
                maxLength={100}
                helpMessagePrimary={t('address-validation:index.address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue={defaultMailingAddress?.address ?? ''}
                errorMessage={errors?.address}
                required
              />
              <InputSelect
                id="country"
                name="countryId"
                className="w-full sm:w-1/2"
                label={t('address-validation:index.address-field.country')}
                autoComplete="country"
                value={countryValue}
                onChange={(e) => {
                  setCountryValue(e.target.value);
                }}
                errorMessage={errors?.countryId}
                options={countryInputOptions}
                required
              />
              {countryProvinceTerritoryStateInputOptions.length > 0 && (
                <InputSelect
                  id="province-state"
                  name="provinceStateId"
                  className="w-full sm:w-1/2"
                  label={t('address-validation:index.address-field.province-state')}
                  defaultValue={defaultMailingAddress?.provinceStateId ?? ''}
                  errorMessage={errors?.provinceStateId}
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
                  defaultValue={defaultMailingAddress?.city ?? ''}
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
                  defaultValue={defaultMailingAddress?.postalZipCode ?? ''}
                  errorMessage={errors?.postalZipCode}
                  required={isPostalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
              <DialogTrigger asChild>
                <LoadingButton type="submit" id="submit-button" name="_action" value={FORM_ACTION.submit} variant="primary" loading={fetcher.isSubmitting} endIcon={faCheck}>
                  {t('address-validation:index.submit-button')}
                </LoadingButton>
              </DialogTrigger>
              {addressDialogContent && addressDialogContent.status === 'address-suggestion' && <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} />}
              {addressDialogContent && addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} />}
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
  suggestedAddress: CanadianAddress;
}

function AddressSuggestionDialogContent({ enteredAddress, suggestedAddress }: AddressSuggestionDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useEnhancedFetcher();
  const enteredAddressOptionValue = 'entered-address';
  const suggestedAddressOptionValue = 'suggested-address';
  type AddressSelectionOption = typeof enteredAddressOptionValue | typeof suggestedAddressOptionValue;
  const [selectedAddressSuggestionOption, setSelectedAddressSuggestionOption] = useState<AddressSelectionOption>(enteredAddressOptionValue);

  async function onSubmitHandler(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.set(submitter.name, submitter.value);

    // Append selected address suggestion to form data
    const selectedAddressSuggestion = selectedAddressSuggestionOption === enteredAddressOptionValue ? enteredAddress : suggestedAddress;
    formData.set('address', selectedAddressSuggestion.address);
    formData.set('city', selectedAddressSuggestion.city);
    formData.set('countryId', selectedAddressSuggestion.countryId);
    formData.set('postalZipCode', selectedAddressSuggestion.postalZipCode);
    formData.set('provinceStateId', selectedAddressSuggestion.provinceStateId);

    await fetcher.submit(formData, { method: 'POST' });
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
                <p className="mb-2">
                  <strong>{t('address-validation:index.dialog.address-suggestion.entered-address-option')}</strong>
                </p>
                <Address address={enteredAddress} />
              </>
            ),
          },
          {
            value: suggestedAddressOptionValue,
            children: (
              <>
                <p className="mb-2">
                  <strong>{t('address-validation:index.dialog.address-suggestion.suggested-address-option')}</strong>
                </p>
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
          <Button id="dialog.corrected-address-close-button" disabled={fetcher.isSubmitting} variant="default" size="sm">
            {t('address-validation:index.dialog.address-suggestion.cancel-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton name="_action" value={FORM_ACTION.useSelectedAddress} type="submit" id="dialog.corrected-address-use-selected-address-button" loading={fetcher.isSubmitting} endIcon={faCheck} variant="primary" size="sm">
            {t('address-validation:index.dialog.address-suggestion.use-selected-address-button')}
          </LoadingButton>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}

interface AddressInvalidDialogContentProps {
  invalidAddress: CanadianAddress;
}

function AddressInvalidDialogContent({ invalidAddress }: AddressInvalidDialogContentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useEnhancedFetcher();

  async function onSubmitHandler(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.set(submitter.name, submitter.value);

    // Append selected address suggestion to form data
    formData.set('address', invalidAddress.address);
    formData.set('city', invalidAddress.city);
    formData.set('countryId', invalidAddress.countryId);
    formData.set('postalZipCode', invalidAddress.postalZipCode);
    formData.set('provinceStateId', invalidAddress.provinceStateId);

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('address-validation:index.dialog.address-invalid.header')}</DialogTitle>
        <DialogDescription>{t('address-validation:index.dialog.address-invalid.description')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <p>
          <strong>{t('address-validation:index.dialog.address-invalid.entered-address')}</strong>
        </p>
        <Address address={invalidAddress} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.address-invalid-close-button" variant="default" size="sm">
            {t('address-validation:index.dialog.address-invalid.close-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton name="_action" value={FORM_ACTION.useInvalidAddress} type="submit" id="dialog.address-invalid-use-entered-address-button" loading={fetcher.isSubmitting} endIcon={faCheck} variant="primary" size="sm">
            {t('address-validation:index.dialog.address-invalid.use-entered-address-button')}
          </LoadingButton>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useLoaderData, useParams } from 'react-router';

import { faCheck, faChevronLeft, faChevronRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import type { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useEnhancedFetcher } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Submit = 'submit',
  UseInvalidAddress = 'use-invalid-address',
  UseSelectedAddress = 'use-selected-address',
}

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
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.updateMailingAddress,
  pageTitleI18nKey: 'renew-ita:update-address.mailing-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:update-address.mailing-address.page-title') }) };

  return {
    id: state.id,
    meta,
    defaultState: state,
    countryList,
    regionList,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.configs.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.domain.services.AddressValidationService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewItaState({ params, request, session });
  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  const isCopyMailingToHome = formData.get('copyMailingAddress') === 'copy';

  const mailingAddressValidator = appContainer.get(TYPES.routes.validators.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
  const validatedResult = await mailingAddressValidator.validateMailingAddress({
    address: String(formData.get('mailingAddress')),
    countryId: String(formData.get('countryId')),
    provinceStateId: formData.get('provinceStateId') ? String(formData.get('provinceStateId')) : undefined,
    city: String(formData.get('mailingCity')),
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
  });

  if (!validatedResult.success) {
    return data({ errors: validatedResult.errors }, { status: 400 });
  }

  const mailingAddress = {
    address: validatedResult.data.address,
    city: validatedResult.data.city,
    country: validatedResult.data.countryId,
    postalCode: validatedResult.data.postalZipCode,
    province: validatedResult.data.provinceStateId,
  };

  const homeAddress = isCopyMailingToHome ? { ...mailingAddress } : undefined;

  const isNotCanada = validatedResult.data.countryId !== clientConfig.CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === 'use-invalid-address';
  const isUseSelectedAddressAction = formAction === 'use-selected-address';
  const canProceedToDental = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToDental) {
    saveRenewState({
      params,
      session,
      state: {
        mailingAddress,
        isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
        ...(homeAddress && { homeAddress }),
      },
    });

    if (state.editMode) {
      return redirect(getPathById('public/renew/$id/ita/review-information', params));
    }
    return redirect(isCopyMailingToHome ? getPathById('public/renew/$id/ita/dental-insurance', params) : getPathById('public/renew/$id/ita/update-home-address', params));
  }

  // Validate Canadian adddress
  invariant(validatedResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  // Build the address object using validated data, transforming unique identifiers
  const formattedMailingAddress: CanadianAddress = {
    address: validatedResult.data.address,
    city: validatedResult.data.city,
    countryId: validatedResult.data.countryId,
    country: countryService.getLocalizedCountryById(validatedResult.data.countryId, locale).name,
    postalZipCode: validatedResult.data.postalZipCode,
    provinceStateId: validatedResult.data.provinceStateId,
    provinceState: validatedResult.data.provinceStateId && provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(validatedResult.data.provinceStateId, locale).abbr,
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

  saveRenewState({
    params,
    session,
    state: {
      mailingAddress,
      isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
      ...(homeAddress && { homeAddress }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }
  return redirect(isCopyMailingToHome ? getPathById('public/renew/$id/ita/dental-insurance', params) : getPathById('public/renew/$id/ita/update-home-address', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function RenewItaUpdateAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList, editMode } = useLoaderData<typeof loader>();
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();
  const params = useParams();
  const fetcher = useEnhancedFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.mailingAddress?.country ?? CANADA_COUNTRY_ID);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState.isHomeAddressSameAsMailingAddress === true);
  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'mailing-address',
    provinceStateId: 'mailing-province',
    countryId: 'mailing-country',
    city: 'mailing-city',
    postalZipCode: 'mailing-postal-code',
    copyMailingAddress: 'copy-mailing-address',
  });
  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };
  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedMailingCountry);
    setMailingCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedMailingCountry, regionList]);

  useEffect(() => {
    setAddressDialogContent(isAddressResponse(fetcher.data) ? fetcher.data : null);
  }, [fetcher, fetcher.data]);

  function onDialogOpenChangeHandler(open: boolean) {
    if (!open) {
      setAddressDialogContent(null);
    }
  }

  const mailingCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedMailingCountry(event.currentTarget.value);
  };

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  const mailingRegions = useMemo<InputOptionProps[]>(() => mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [mailingCountryRegions]);

  const dummyOption: InputOptionProps = { children: t('renew-ita:update-address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);
  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={70} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <legend className="sr-only">{t('renew-ita:update-address.mailing-address.header')}</legend>
            <div className="space-y-6">
              <InputSanitizeField
                id="mailing-address"
                name="mailingAddress"
                className="w-full"
                label={t('renew-ita:update-address.address-field.address')}
                maxLength={30}
                helpMessagePrimary={t('renew-ita:update-address.address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue={defaultState.mailingAddress?.address}
                errorMessage={errors?.address}
                required
              />
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField
                  id="mailing-city"
                  name="mailingCity"
                  className="w-full"
                  label={t('renew-ita:update-address.address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  defaultValue={defaultState.mailingAddress?.city}
                  errorMessage={errors?.city}
                  required
                />
                <InputSanitizeField
                  id="mailing-postal-code"
                  name="postalZipCode"
                  className="w-full"
                  label={isPostalCodeRequired ? t('renew-ita:update-address.address-field.postal-code') : t('renew-ita:update-address.address-field.postal-code-optional')}
                  maxLength={100}
                  autoComplete="postal-code"
                  defaultValue={defaultState.mailingAddress?.postalCode}
                  errorMessage={errors?.postalZipCode}
                  required={isPostalCodeRequired}
                />
              </div>
              {mailingRegions.length > 0 && (
                <InputSelect
                  id="mailing-province"
                  name="provinceStateId"
                  className="w-full sm:w-1/2"
                  label={t('renew-ita:update-address.address-field.province')}
                  defaultValue={defaultState.mailingAddress?.province}
                  errorMessage={errors?.provinceStateId}
                  options={[dummyOption, ...mailingRegions]}
                  required
                />
              )}
              <InputSelect
                id="mailing-country"
                name="countryId"
                className="w-full sm:w-1/2"
                label={t('renew-ita:update-address.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState.mailingAddress?.country}
                errorMessage={errors?.countryId}
                options={countries}
                onChange={mailingCountryChangeHandler}
                required
              />
              <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" value="copy" checked={copyAddressChecked} onChange={checkHandler}>
                {t('renew-ita:update-address.home-address.use-mailing-address')}
              </InputCheckbox>
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
                <DialogTrigger asChild>
                  <LoadingButton variant="primary" id="continue-button" type="submit" name="_action" value={FormAction.Submit} loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Mailing address click">
                    {t('renew-ita:update-address.save-btn')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} copyAddressToHome={copyAddressChecked} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} copyAddressToHome={copyAddressChecked} />}
                  </>
                )}
              </Dialog>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Mailing address click">
                {t('renew-ita:update-address.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
                <DialogTrigger asChild>
                  <LoadingButton
                    variant="primary"
                    id="continue-button"
                    type="submit"
                    name="_action"
                    value={FormAction.Submit}
                    loading={isSubmitting}
                    endIcon={faChevronRight}
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Mailing address click"
                  >
                    {t('renew-ita:update-address.continue')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} copyAddressToHome={copyAddressChecked} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} copyAddressToHome={copyAddressChecked} />}
                  </>
                )}
              </Dialog>

              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/ita/confirm-address"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Mailing address click"
              >
                {t('renew-ita:update-address.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

interface AddressSuggestionDialogContentProps {
  enteredAddress: CanadianAddress;
  suggestedAddress: CanadianAddress;
  copyAddressToHome: boolean;
}

function AddressSuggestionDialogContent({ enteredAddress, suggestedAddress, copyAddressToHome }: AddressSuggestionDialogContentProps) {
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
    formData.set('mailingAddress', selectedAddressSuggestion.address);
    formData.set('mailingCity', selectedAddressSuggestion.city);
    formData.set('countryId', selectedAddressSuggestion.countryId);
    formData.set('postalZipCode', selectedAddressSuggestion.postalZipCode);
    formData.set('provinceStateId', selectedAddressSuggestion.provinceStateId);
    if (copyAddressToHome) {
      formData.set('copyMailingAddress', 'copy');
    }

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 text-amber-700" />
          {t('renew-ita:update-address.dialog.address-suggestion.header')}
        </DialogTitle>
        <DialogDescription>{t('renew-ita:update-address.dialog.address-suggestion.description')}</DialogDescription>
      </DialogHeader>
      <InputRadios
        id="addressSelection"
        name="addressSelection"
        legend={t('renew-ita:update-address.dialog.address-suggestion.address-selection-legend')}
        options={[
          {
            value: enteredAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('renew-ita:update-address.dialog.address-suggestion.entered-address-option')}</p>
                <Address address={enteredAddress} />
              </>
            ),
          },
          {
            value: suggestedAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('renew-ita:update-address.dialog.address-suggestion.suggested-address-option')}</p>
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
          <Button id="dialog.corrected-address-close-button" startIcon={faChevronLeft} disabled={fetcher.isSubmitting} variant="alternative" size="sm">
            {t('renew-ita:update-address.dialog.address-suggestion.cancel-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton name="_action" value={FormAction.UseSelectedAddress} type="submit" id="dialog.corrected-address-use-selected-address-button" loading={fetcher.isSubmitting} endIcon={faCheck} variant="primary" size="sm">
            {t('renew-ita:update-address.dialog.address-suggestion.use-selected-address-button')}
          </LoadingButton>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}

interface AddressInvalidDialogContentProps {
  invalidAddress: CanadianAddress;
  copyAddressToHome: boolean;
}

function AddressInvalidDialogContent({ invalidAddress, copyAddressToHome }: AddressInvalidDialogContentProps) {
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
    formData.set('mailingAddress', invalidAddress.address);
    formData.set('mailingCity', invalidAddress.city);
    formData.set('countryId', invalidAddress.countryId);
    formData.set('postalZipCode', invalidAddress.postalZipCode);
    formData.set('provinceStateId', invalidAddress.provinceStateId);
    if (copyAddressToHome) {
      formData.set('copyMailingAddress', 'copy');
    }

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 text-amber-700" />
          {t('renew-ita:update-address.dialog.address-invalid.header')}
        </DialogTitle>
        <DialogDescription>{t('renew-ita:update-address.dialog.address-invalid.description')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <p className="font-semibold">{t('renew-ita:update-address.dialog.address-invalid.entered-address')}</p>
        <Address address={invalidAddress} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.address-invalid-close-button" startIcon={faChevronLeft} variant="alternative" size="sm">
            {t('renew-ita:update-address.dialog.address-invalid.close-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton name="_action" value={FormAction.UseInvalidAddress} type="submit" id="dialog.address-invalid-use-entered-address-button" loading={fetcher.isSubmitting} endIcon={faCheck} variant="primary" size="sm">
            {t('renew-ita:update-address.dialog.address-invalid.use-entered-address-button')}
          </LoadingButton>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}

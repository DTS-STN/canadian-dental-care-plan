import type { SyntheticEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { data, redirect } from 'react-router';

import { faCheck, faChevronLeft, faChevronRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/update-home-address';

import { TYPES } from '~/.server/constants';
import { loadRenewChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.updateHomeAddress,
  pageTitleI18nKey: 'renew-child:update-address.home-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:update-address.home-address.page-title') }) };

  return {
    id: state.id,
    meta,
    defaultState: state,
    countryList,
    regionList,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.configs.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.domain.services.AddressValidationService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewChildState({ params, request, session });

  const homeAddressValidator = appContainer.get(TYPES.routes.validators.HomeAddressValidatorFactory).createHomeAddressValidator(locale);

  const parsedDataResult = await homeAddressValidator.validateHomeAddress({
    address: String(formData.get('homeAddress')),
    countryId: String(formData.get('homeCountry')),
    provinceStateId: formData.get('homeProvince') ? String(formData.get('homeProvince')) : undefined,
    city: String(formData.get('homeCity')),
    postalZipCode: formData.get('homePostalCode') ? String(formData.get('homePostalCode')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: parsedDataResult.errors }, { status: 400 });
  }

  const homeAddress = {
    address: parsedDataResult.data.address,
    city: parsedDataResult.data.city,
    country: parsedDataResult.data.countryId,
    postalCode: parsedDataResult.data.postalZipCode,
    province: parsedDataResult.data.provinceStateId,
  };

  const isNotCanada = parsedDataResult.data.countryId !== clientConfig.CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === 'use-invalid-address';
  const isUseSelectedAddressAction = formAction === 'use-selected-address';
  const canProceedToDental = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;
  if (canProceedToDental) {
    saveRenewState({ params, session, state: { homeAddress } });

    if (state.editMode) {
      return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
    }
    return redirect(getPathById('public/renew/$id/child/review-child-information', params));
  }

  invariant(parsedDataResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(parsedDataResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  // Build the address object using validated data, transforming unique identifiers
  const formattedHomeAddress: CanadianAddress = {
    address: parsedDataResult.data.address,
    city: parsedDataResult.data.city,
    countryId: parsedDataResult.data.countryId,
    country: countryService.getLocalizedCountryById(parsedDataResult.data.countryId, locale).name,
    postalZipCode: parsedDataResult.data.postalZipCode,
    provinceStateId: parsedDataResult.data.provinceStateId,
    provinceState: parsedDataResult.data.provinceStateId && provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(parsedDataResult.data.provinceStateId, locale).abbr,
  };

  const addressCorrectionResult = await addressValidationService.getAddressCorrectionResult({
    address: formattedHomeAddress.address,
    city: formattedHomeAddress.city,
    postalCode: formattedHomeAddress.postalZipCode,
    provinceCode: formattedHomeAddress.provinceState,
    userId: 'anonymous',
  });

  if (addressCorrectionResult.status === 'not-correct') {
    return {
      invalidAddress: formattedHomeAddress,
      status: 'address-invalid',
    } as const satisfies AddressInvalidResponse;
  }

  if (addressCorrectionResult.status === 'corrected') {
    const provinceTerritoryState = provinceTerritoryStateService.getLocalizedProvinceTerritoryStateByCode(addressCorrectionResult.provinceCode, locale);
    return {
      enteredAddress: formattedHomeAddress,
      status: 'address-suggestion',
      suggestedAddress: {
        address: addressCorrectionResult.address,
        city: addressCorrectionResult.city,
        country: formattedHomeAddress.country,
        countryId: formattedHomeAddress.countryId,
        postalZipCode: addressCorrectionResult.postalCode,
        provinceState: provinceTerritoryState.abbr,
        provinceStateId: provinceTerritoryState.id,
      },
    } as const satisfies AddressSuggestionResponse;
  }
  saveRenewState({ params, session, state: { homeAddress } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
  }
  return redirect(getPathById('public/renew/$id/child/review-child-information', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function RenewChildUpdateAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList, editMode } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useEnhancedFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState.homeAddress?.country ?? CANADA_COUNTRY_ID);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);
  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'home-address',
    provinceStateId: 'home-province',
    countryId: 'home-country',
    city: 'home-city',
    postalZipCode: 'home-postal-code',
  });

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedHomeCountry);
    setHomeCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedHomeCountry, regionList]);

  useEffect(() => {
    setAddressDialogContent(isAddressResponse(fetcher.data) ? fetcher.data : null);
  }, [fetcher, fetcher.data]);

  function onDialogOpenChangeHandler(open: boolean) {
    if (!open) {
      setAddressDialogContent(null);
    }
  }
  const homeCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedHomeCountry(event.currentTarget.value);
  };

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  const homeRegions = useMemo<InputOptionProps[]>(() => homeCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [homeCountryRegions]);

  const dummyOption: InputOptionProps = { children: t('renew-child:update-address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedHomeCountry);
  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={87} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-8">
            <div className="space-y-6">
              <>
                <InputSanitizeField
                  id="home-address"
                  name="homeAddress"
                  className="w-full"
                  label={t('renew-child:update-address.address-field.address')}
                  helpMessagePrimary={t('renew-child:update-address.address-field.address-note')}
                  helpMessagePrimaryClassName="text-black"
                  maxLength={100}
                  autoComplete="address-line1"
                  defaultValue={defaultState.homeAddress?.address}
                  errorMessage={errors?.address}
                  required
                />
                <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
                  <InputSanitizeField
                    id="home-city"
                    name="homeCity"
                    className="w-full"
                    label={t('renew-child:update-address.address-field.city')}
                    maxLength={100}
                    autoComplete="address-level2"
                    defaultValue={defaultState.homeAddress?.city}
                    errorMessage={errors?.city}
                    required
                  />
                  <InputSanitizeField
                    id="home-postal-code"
                    name="homePostalCode"
                    className="w-full"
                    label={isPostalCodeRequired ? t('renew-child:update-address.address-field.postal-code') : t('renew-child:update-address.address-field.postal-code-optional')}
                    maxLength={100}
                    autoComplete="postal-code"
                    defaultValue={defaultState.homeAddress?.postalCode ?? ''}
                    errorMessage={errors?.postalZipCode}
                    required={isPostalCodeRequired}
                  />
                </div>
                {homeRegions.length > 0 && (
                  <InputSelect
                    id="home-province"
                    name="homeProvince"
                    className="w-full sm:w-1/2"
                    label={t('renew-child:update-address.address-field.province')}
                    defaultValue={defaultState.homeAddress?.province}
                    errorMessage={errors?.provinceStateId}
                    options={[dummyOption, ...homeRegions]}
                    required
                  />
                )}
                <InputSelect
                  id="home-country"
                  name="homeCountry"
                  className="w-full sm:w-1/2"
                  label={t('renew-child:update-address.address-field.country')}
                  autoComplete="country"
                  defaultValue={defaultState.homeAddress?.country ?? ''}
                  errorMessage={errors?.countryId}
                  options={countries}
                  onChange={homeCountryChangeHandler}
                  required
                />
              </>
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
                <DialogTrigger asChild>
                  <LoadingButton variant="primary" id="save-button" type="submit" name="_action" value={FormAction.Submit} loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Save - Home address click">
                    {t('renew-child:update-address.save-btn')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} />}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} />}
                  </>
                )}
              </Dialog>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/child/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Cancel - Home address click">
                {t('renew-child:update-address.cancel-btn')}
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
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Continue - Home address click"
                  >
                    {t('renew-child:update-address.continue')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} />}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} />}
                  </>
                )}
              </Dialog>
              <ButtonLink
                id="back-button"
                routeId={defaultState.hasAddressChanged ? `public/renew/$id/child/update-mailing-address` : `public/renew/$id/child/confirm-address`}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Home address click"
              >
                {t('renew-child:update-address.back')}
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
    formData.set('homeAddress', selectedAddressSuggestion.address);
    formData.set('homeCity', selectedAddressSuggestion.city);
    formData.set('homeCountry', selectedAddressSuggestion.countryId);
    formData.set('homePostalCode', selectedAddressSuggestion.postalZipCode);
    formData.set('homeProvince', selectedAddressSuggestion.provinceStateId);

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 text-amber-700" />
          {t('renew-child:update-address.dialog.address-suggestion.header')}
        </DialogTitle>
        <DialogDescription>{t('renew-child:update-address.dialog.address-suggestion.description')}</DialogDescription>
      </DialogHeader>
      <InputRadios
        id="addressSelection"
        name="addressSelection"
        legend={t('renew-child:update-address.dialog.address-suggestion.address-selection-legend')}
        options={[
          {
            value: enteredAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('renew-child:update-address.dialog.address-suggestion.entered-address-option')}</p>
                <Address address={enteredAddress} />
              </>
            ),
          },
          {
            value: suggestedAddressOptionValue,
            children: (
              <>
                <p className="mb-2 font-semibold">{t('renew-child:update-address.dialog.address-suggestion.suggested-address-option')}</p>
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
          <Button
            id="dialog.corrected-address-close-button"
            startIcon={faChevronLeft}
            disabled={fetcher.isSubmitting}
            variant="alternative"
            size="sm"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Dialog Back - Home address click"
          >
            {t('renew-child:update-address.dialog.address-suggestion.cancel-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton
            name="_action"
            value={FormAction.UseSelectedAddress}
            type="submit"
            id="dialog.corrected-address-use-selected-address-button"
            loading={fetcher.isSubmitting}
            endIcon={faCheck}
            variant="primary"
            size="sm"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Dialog Use Selected Address - Home address click"
          >
            {t('renew-child:update-address.dialog.address-suggestion.use-selected-address-button')}
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
    formData.set('homeAddress', invalidAddress.address);
    formData.set('homeCity', invalidAddress.city);
    formData.set('homeCountry', invalidAddress.countryId);
    formData.set('homePostalCode', invalidAddress.postalZipCode);
    formData.set('homeProvince', invalidAddress.provinceStateId);

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <DialogContent aria-describedby={undefined} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 text-amber-700" />
          {t('renew-child:update-address.dialog.address-invalid.header')}
        </DialogTitle>
        <DialogDescription>{t('renew-child:update-address.dialog.address-invalid.description')}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <p className="font-semibold">{t('renew-child:update-address.dialog.address-invalid.entered-address')}</p>
        <Address address={invalidAddress} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button id="dialog.address-invalid-close-button" startIcon={faChevronLeft} variant="alternative" size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Dialog Back - Home address click">
            {t('renew-child:update-address.dialog.address-invalid.close-button')}
          </Button>
        </DialogClose>
        <fetcher.Form method="post" noValidate onSubmit={onSubmitHandler}>
          <LoadingButton
            name="_action"
            value={FormAction.UseInvalidAddress}
            type="submit"
            id="dialog.address-invalid-use-entered-address-button"
            loading={fetcher.isSubmitting}
            endIcon={faCheck}
            variant="primary"
            size="sm"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Dialog Use Entered Address - Home address click"
          >
            {t('renew-child:update-address.dialog.address-invalid.use-entered-address-button')}
          </LoadingButton>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}

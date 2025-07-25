import { useEffect, useMemo, useState } from 'react';

import { data, redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/update-mailing-address';

import { TYPES } from '~/.server/constants';
import { loadRenewChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { AddressInvalidResponse, AddressResponse, AddressSuggestionResponse, CanadianAddress } from '~/components/address-validation-dialog';
import { AddressInvalidDialogContent, AddressSuggestionDialogContent } from '~/components/address-validation-dialog';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import type { InputOptionProps } from '~/components/input-option';
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

const FORM_ACTION = {
  submit: 'submit',
  cancel: 'cancel',
  useInvalidAddress: 'use-invalid-address',
  useSelectedAddress: 'use-selected-address',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.updateMailingAddress,
  pageTitleI18nKey: 'renew-child:update-address.mailing-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = await appContainer.get(TYPES.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:update-address.mailing-address.page-title') }) };

  return {
    meta,
    defaultState: state,
    countryList,
    regionList,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.AddressValidationService);
  const countryService = appContainer.get(TYPES.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);
  const securityHandler = appContainer.get(TYPES.SecurityHandler);

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewChildState({ params, request, session });
  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  const isCopyMailingToHome = formData.get('syncAddresses') === 'true';

  if (formAction === FORM_ACTION.cancel) {
    saveRenewState({
      params,
      session,
      state: {
        hasAddressChanged: state.previousAddressState?.hasAddressChanged,
        isHomeAddressSameAsMailingAddress: state.previousAddressState?.isHomeAddressSameAsMailingAddress,
      },
    });
    return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
  }

  const mailingAddressValidator = appContainer.get(TYPES.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
  const validatedResult = await mailingAddressValidator.validateMailingAddress({
    address: String(formData.get('address')),
    countryId: String(formData.get('countryId')),
    provinceStateId: formData.get('provinceStateId') ? String(formData.get('provinceStateId')) : undefined,
    city: String(formData.get('city')),
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
  const isUseInvalidAddressAction = formAction === FORM_ACTION.useInvalidAddress;
  const isUseSelectedAddressAction = formAction === FORM_ACTION.useSelectedAddress;
  const canProceedToReviewChild = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToReviewChild) {
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
      return redirect(isCopyMailingToHome ? getPathById('public/renew/$id/child/review-adult-information', params) : getPathById('public/renew/$id/child/update-home-address', params));
    }
    return redirect(isCopyMailingToHome ? getPathById('public/renew/$id/child/review-child-information', params) : getPathById('public/renew/$id/child/update-home-address', params));
  }

  // Validate Canadian adddress
  invariant(validatedResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  const country = await countryService.getLocalizedCountryById(validatedResult.data.countryId, locale);
  const provinceTerritoryState = await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(validatedResult.data.provinceStateId, locale);

  // Build the address object using validated data, transforming unique identifiers
  const formattedMailingAddress: CanadianAddress = {
    address: validatedResult.data.address,
    city: validatedResult.data.city,
    countryId: validatedResult.data.countryId,
    country: country.name,
    postalZipCode: validatedResult.data.postalZipCode,
    provinceStateId: validatedResult.data.provinceStateId,
    provinceState: validatedResult.data.provinceStateId && provinceTerritoryState.abbr,
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
    const provinceTerritoryState = await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateByCode(addressCorrectionResult.provinceCode, locale);
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
    return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
  }
  return redirect(isCopyMailingToHome ? getPathById('public/renew/$id/child/review-child-information', params) : getPathById('public/renew/$id/child/update-home-address', params));
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
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.mailingAddress?.country ?? CANADA_COUNTRY_ID);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState.isHomeAddressSameAsMailingAddress === true);
  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'mailing-address',
    city: 'mailing-city',
    postalZipCode: 'mailing-postal-code',
    provinceStateId: 'mailing-province',
    countryId: 'mailing-country',
    syncAddresses: 'sync-addresses',
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

  const dummyOption: InputOptionProps = { children: t('renew-child:update-address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);
  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={84} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <div className="space-y-6">
              <InputSanitizeField
                id="mailing-address"
                name="address"
                className="w-full"
                label={t('renew-child:update-address.address-field.address')}
                maxLength={100}
                helpMessagePrimary={t('renew-child:update-address.address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue={defaultState.mailingAddress?.address}
                errorMessage={errors?.address}
                required
              />
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField
                  id="mailing-city"
                  name="city"
                  className="w-full"
                  label={t('renew-child:update-address.address-field.city')}
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
                  label={isPostalCodeRequired ? t('renew-child:update-address.address-field.postal-code') : t('renew-child:update-address.address-field.postal-code-optional')}
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
                  label={t('renew-child:update-address.address-field.province')}
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
                label={t('renew-child:update-address.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState.mailingAddress?.country}
                errorMessage={errors?.countryId}
                options={countries}
                onChange={mailingCountryChangeHandler}
                required
              />
              <InputCheckbox id="sync-addresses" name="syncAddresses" value="true" checked={copyAddressChecked} onChange={checkHandler}>
                {t('renew-child:update-address.home-address.use-mailing-address')}
              </InputCheckbox>
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
                <DialogTrigger asChild>
                  <LoadingButton
                    aria-expanded={undefined}
                    variant="primary"
                    id="save-button"
                    type="submit"
                    name="_action"
                    value={FORM_ACTION.submit}
                    loading={isSubmitting}
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Save - Mailing address click"
                  >
                    {t('renew-child:update-address.save-btn')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useSelectedAddress} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useInvalidAddress} />}
                  </>
                )}
              </Dialog>
              <Button id="cancel-button" name="_action" disabled={isSubmitting} value={FORM_ACTION.cancel} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Cancel - Mailing address click">
                {t('renew-child:update-address.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Dialog open={addressDialogContent !== null} onOpenChange={onDialogOpenChangeHandler}>
                <DialogTrigger asChild>
                  <LoadingButton
                    aria-expanded={undefined}
                    variant="primary"
                    id="continue-button"
                    type="submit"
                    name="_action"
                    value={FORM_ACTION.submit}
                    loading={isSubmitting}
                    endIcon={faChevronRight}
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Continue - Mailing address click"
                  >
                    {t('renew-child:update-address.continue')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useSelectedAddress} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useInvalidAddress} />}
                  </>
                )}
              </Dialog>

              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/child/confirm-address"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Mailing address click"
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

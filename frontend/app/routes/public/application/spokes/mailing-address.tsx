import { useEffect, useMemo, useState } from 'react';

import { data, redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/mailing-address';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { AddressInvalidResponse, AddressResponse, AddressSuggestionResponse, CanadianAddress } from '~/components/address-validation-dialog';
import { AddressInvalidDialogContent, AddressSuggestionDialogContent } from '~/components/address-validation-dialog';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
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
  useInvalidAddress: 'use-invalid-address',
  useSelectedAddress: 'use-selected-address',
} as const;

function getRouteFromTypeAndFlow(typeAndFlow: string) {
  switch (typeAndFlow) {
    case 'new-children': {
      return `public/application/$id/${typeAndFlow}/parent-or-guardian`;
    }
    default: {
      return `public/application/$id/${typeAndFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.mailingAddress,
  pageTitleI18nKey: 'application-spokes:address.mailing-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const countryList = await appContainer.get(TYPES.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:address.mailing-address.page-title') }) };

  return {
    defaultState: state,
    typeAndFlow: `${state.typeOfApplication}-${state.typeOfApplicationFlow}`,
    countryList,
    regionList,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family']);

  const formData = await request.formData();
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.AddressValidationService);
  const countryService = appContainer.get(TYPES.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);
  const securityHandler = appContainer.get(TYPES.SecurityHandler);

  securityHandler.validateCsrfToken({ formData, session });
  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  const isCopyMailingToHome = formData.get('syncAddresses') === 'true';

  const typeAndFlow = `${state.typeOfApplication}-${state.typeOfApplicationFlow}`;

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
  const canProceedToDental = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToDental) {
    savePublicApplicationState({
      params,
      session,
      state: {
        mailingAddress,
        isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
        ...(homeAddress && { homeAddress }),
      },
    });

    return redirect(isCopyMailingToHome ? getPathById(getRouteFromTypeAndFlow(typeAndFlow), params) : getPathById('public/application/$id/home-address', params));
  }

  // Validate Canadian address
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

  savePublicApplicationState({
    params,
    session,
    state: {
      mailingAddress,
      isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
      ...(homeAddress && { homeAddress }),
    },
  });

  return redirect(isCopyMailingToHome ? getPathById(getRouteFromTypeAndFlow(typeAndFlow), params) : getPathById('public/application/$id/home-address', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function MailingAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList, typeAndFlow } = loaderData;
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
    apartment: '',
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

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions = useMemo<InputOptionProps[]>(() => mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [mailingCountryRegions]);

  const dummyOption: InputOptionProps = { children: t('application-spokes:address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <div className="space-y-6">
              <InputSanitizeField
                id="mailing-address"
                name="address"
                className="w-full"
                label={t('application-spokes:address.address-field.address')}
                maxLength={100}
                helpMessagePrimary={t('application-spokes:address.address-field.address-note')}
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
                  label={t('application-spokes:address.address-field.city')}
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
                  label={isPostalCodeRequired ? t('application-spokes:address.address-field.postal-code') : t('application-spokes:address.address-field.postal-code-optional')}
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
                  label={t('application-spokes:address.address-field.province')}
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
                label={t('application-spokes:address.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState.mailingAddress?.country}
                errorMessage={errors?.countryId}
                options={countries}
                onChange={mailingCountryChangeHandler}
                required
              />
              <InputCheckbox id="sync-addresses" name="syncAddresses" value="true" checked={copyAddressChecked} onChange={checkHandler}>
                {t('application-spokes:address.home-address.use-mailing-address')}
              </InputCheckbox>
            </div>
          </fieldset>
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
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Mailing address click"
                >
                  {copyAddressChecked ? t('application-spokes:address.save-btn') : t('application-spokes:address.continue')}
                </LoadingButton>
              </DialogTrigger>
              {!fetcher.isSubmitting && addressDialogContent && (
                <>
                  {addressDialogContent.status === 'address-suggestion' && (
                    <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useSelectedAddress} />
                  )}
                  {addressDialogContent.status === 'address-invalid' && (
                    <AddressInvalidDialogContent addressContext="mailing-address" invalidAddress={addressDialogContent.invalidAddress} syncAddresses={copyAddressChecked} formAction={FORM_ACTION.useInvalidAddress} />
                  )}
                </>
              )}
            </Dialog>

            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={getRouteFromTypeAndFlow(typeAndFlow)}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Mailing address click"
            >
              {t('application-spokes:address.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

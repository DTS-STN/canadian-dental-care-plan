import { useEffect, useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/mailing-address';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { AddressInvalidResponse, AddressResponse, AddressSuggestionResponse, CanadianAddress } from '~/components/address-validation-dialog';
import { AddressInvalidDialogContent, AddressSuggestionDialogContent } from '~/components/address-validation-dialog';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogTrigger } from '~/components/dialog';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatAddressLine } from '~/utils/string-utils';

const FORM_ACTION = {
  submit: 'submit',
  useInvalidAddress: 'use-invalid-address',
  useSelectedAddress: 'use-selected-address',
} as const;

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'intake-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    case 'renewal-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `protected/application/$id/${applicationFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.mailingAddress,
  pageTitleI18nKey: 'protected-application-spokes:address.mailing-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const countryList = await appContainer.get(TYPES.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:address.mailing-address.page-title') }) };

  return {
    defaultState: {
      address: state.mailingAddress?.value?.address,
      city: state.mailingAddress?.value?.city,
      postalCode: state.mailingAddress?.value?.postalCode,
      province: state.mailingAddress?.value?.province,
      country: state.mailingAddress?.value?.country,
      isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress,
    },
    applicationFlow: `${state.context}-${state.typeOfApplication}` as const,
    countryList,
    regionList,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });

  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.AddressValidationService);
  const countryService = appContainer.get(TYPES.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  const isCopyMailingToHome = formData.get('syncAddresses') === 'true';

  const applicationFlow: ApplicationFlow = `${state.context}-${state.typeOfApplication}`;

  const mailingAddressValidator = appContainer.get(TYPES.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
  const parsedDataResult = await mailingAddressValidator.validateMailingAddress({
    address: formData.get('address')?.toString(),
    apartment: formData.get('apartment')?.toString(),
    countryId: formData.get('countryId')?.toString(),
    provinceStateId: formData.get('provinceStateId')?.toString(),
    city: formData.get('city')?.toString(),
    postalZipCode: formData.get('postalZipCode')?.toString(),
  });

  if (!parsedDataResult.success) {
    return data({ errors: parsedDataResult.errors }, { status: 400 });
  }

  const formattedAddress = formatAddressLine({ address: parsedDataResult.data.address, apartment: parsedDataResult.data.apartment });

  const mailingAddress = {
    address: formattedAddress,
    city: parsedDataResult.data.city,
    country: parsedDataResult.data.countryId,
    postalCode: parsedDataResult.data.postalZipCode,
    province: parsedDataResult.data.provinceStateId,
  };

  const homeAddress = isCopyMailingToHome ? { ...mailingAddress } : undefined;

  const isNotCanada = parsedDataResult.data.countryId !== clientConfig.CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === FORM_ACTION.useInvalidAddress;
  const isUseSelectedAddressAction = formAction === FORM_ACTION.useSelectedAddress;
  const canProceedToDental = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToDental) {
    saveProtectedApplicationState({
      params,
      session,
      state: {
        mailingAddress: {
          value: mailingAddress,
          hasChanged: true,
        },
        isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
        ...(homeAddress && { homeAddress: { value: homeAddress, hasChanged: true } }),
      },
    });

    return redirect(isCopyMailingToHome ? getPathById(getRouteFromApplicationFlow(applicationFlow), params) : getPathById('protected/application/$id/home-address', params));
  }

  // Validate Canadian address
  invariant(parsedDataResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(parsedDataResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  const country = await countryService.getLocalizedCountryById(parsedDataResult.data.countryId, locale);
  const provinceTerritoryState = await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(parsedDataResult.data.provinceStateId, locale);

  // Build the address object using validated data, transforming unique identifiers
  const formattedMailingAddress: CanadianAddress = {
    address: formattedAddress,
    city: parsedDataResult.data.city,
    countryId: parsedDataResult.data.countryId,
    country: country.name,
    postalZipCode: parsedDataResult.data.postalZipCode,
    provinceStateId: parsedDataResult.data.provinceStateId,
    provinceState: parsedDataResult.data.provinceStateId && provinceTerritoryState.abbr,
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

  saveProtectedApplicationState({
    params,
    session,
    state: {
      mailingAddress: {
        value: mailingAddress,
        hasChanged: true,
      },
      isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
      ...(homeAddress && { homeAddress: { value: homeAddress, hasChanged: true } }),
    },
  });

  return redirect(isCopyMailingToHome ? getPathById(getRouteFromApplicationFlow(applicationFlow), params) : getPathById('protected/application/$id/home-address', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function MailingAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList, applicationFlow } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.country ?? CANADA_COUNTRY_ID);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState.isHomeAddressSameAsMailingAddress === true);
  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

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

  const dummyOption: InputOptionProps = { children: t('protected-application-spokes:address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-application:optional-label')}</p>
        <ErrorSummaryProvider actionData={fetcher.data}>
          <ErrorSummary />
          <fetcher.Form method="post" noValidate>
            <CsrfTokenInput />
            <fieldset className="mb-6">
              <div className="space-y-6">
                <InputSanitizeField
                  id="mailing-address"
                  name="address"
                  className="w-full"
                  label={t('protected-application-spokes:address.address-field.address')}
                  maxLength={100}
                  helpMessagePrimary={t('protected-application-spokes:address.address-field.address-help')}
                  helpMessagePrimaryClassName="text-black"
                  autoComplete="address-line1"
                  defaultValue={defaultState.address}
                  errorMessage={errors?.address}
                  required
                />
                <InputSanitizeField
                  id="mailing-apartment"
                  name="apartment"
                  className="w-full"
                  label={t('protected-application-spokes:address.address-field.apartment')}
                  maxLength={100}
                  helpMessagePrimary={t('protected-application-spokes:address.address-field.apartment-help')}
                  helpMessagePrimaryClassName="text-black"
                  autoComplete="address-line2"
                  defaultValue=""
                  errorMessage={errors?.apartment}
                />
                <div className="grid items-end gap-6 md:grid-cols-2">
                  <InputSanitizeField
                    id="mailing-city"
                    name="city"
                    className="w-full"
                    label={t('protected-application-spokes:address.address-field.city')}
                    maxLength={100}
                    autoComplete="address-level2"
                    defaultValue={defaultState.city}
                    errorMessage={errors?.city}
                    required
                  />
                  <InputSanitizeField
                    id="mailing-postal-code"
                    name="postalZipCode"
                    className="w-full"
                    label={isPostalCodeRequired ? t('protected-application-spokes:address.address-field.postal-code') : t('protected-application-spokes:address.address-field.postal-code-optional')}
                    maxLength={100}
                    autoComplete="postal-code"
                    defaultValue={defaultState.postalCode}
                    errorMessage={errors?.postalZipCode}
                    required={isPostalCodeRequired}
                  />
                </div>

                {mailingRegions.length > 0 && (
                  <InputSelect
                    id="mailing-province"
                    name="provinceStateId"
                    className="w-full sm:w-1/2"
                    label={t('protected-application-spokes:address.address-field.province')}
                    defaultValue={defaultState.province}
                    errorMessage={errors?.provinceStateId}
                    options={[dummyOption, ...mailingRegions]}
                    required
                  />
                )}
                <InputSelect
                  id="mailing-country"
                  name="countryId"
                  className="w-full sm:w-1/2"
                  label={t('protected-application-spokes:address.address-field.country')}
                  autoComplete="country"
                  defaultValue={defaultState.country}
                  errorMessage={errors?.countryId}
                  options={countries}
                  onChange={mailingCountryChangeHandler}
                  required
                />
                <InputCheckbox id="sync-addresses" name="syncAddresses" value="true" checked={copyAddressChecked} onChange={checkHandler}>
                  {t('protected-application-spokes:address.home-address.use-mailing-address')}
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
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Continue - Mailing address click"
                  >
                    {copyAddressChecked ? t('protected-application-spokes:address.save-btn') : t('protected-application-spokes:address.continue')}
                  </LoadingButton>
                </DialogTrigger>
                {!isSubmitting && addressDialogContent && (
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
                routeId={getRouteFromApplicationFlow(applicationFlow)}
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Mailing address click"
              >
                {t('protected-application-spokes:address.back')}
              </ButtonLink>
            </div>
          </fetcher.Form>
        </ErrorSummaryProvider>
      </div>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/home-address';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { AddressInvalidDialogContent, AddressSuggestionDialogContent } from '~/components/address-validation-dialog';
import type { AddressInvalidResponse, AddressResponse, AddressSuggestionResponse, CanadianAddress } from '~/components/address-validation-dialog';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
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
  breadcrumbs: [{ labelI18nKey: 'protected-profile:contact-information.page-title', routeId: 'protected/profile/contact-information' }],
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.editHomeAddress,
  pageTitleI18nKey: 'protected-profile:home-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = await appContainer.get(TYPES.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = await appContainer.get(TYPES.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:home-address.page-title') }) };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.home-address', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      address: clientApplication.contactInformation.homeAddress,
      city: clientApplication.contactInformation.homeCity,
      postalCode: clientApplication.contactInformation.homePostalCode,
      province: clientApplication.contactInformation.homeProvince,
      country: clientApplication.contactInformation.homeCountry,
    },
    countryList,
    regionList,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.AddressValidationService);
  const countryService = appContainer.get(TYPES.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.ProvinceTerritoryStateService);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

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

  const homeAddress = {
    address: validatedResult.data.address,
    city: validatedResult.data.city,
    country: validatedResult.data.countryId,
    postalCode: validatedResult.data.postalZipCode,
    province: validatedResult.data.provinceStateId,
  };

  const isNotCanada = validatedResult.data.countryId !== clientConfig.CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === FORM_ACTION.useInvalidAddress;
  const isUseSelectedAddressAction = formAction === FORM_ACTION.useSelectedAddress;
  const canProceed = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.home-address', { userId: idToken.sub });

  if (canProceed) {
    await appContainer.get(TYPES.ProfileService).updateHomeAddress(homeAddress);
    return redirect(getPathById('protected/profile/contact-information', params));
  }

  // Validate Canadian adddress
  invariant(validatedResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  const country = await countryService.getLocalizedCountryById(validatedResult.data.countryId, locale);
  const provinceTerritoryState = await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(validatedResult.data.provinceStateId, locale);

  const validatedConcatenatedAddress = validatedResult.data.address + ' ' + validatedResult.data.unitNumber;

  // Build the address object using validated data, transforming unique identifiers
  const formattedHomeAddress: CanadianAddress = {
    address: validatedConcatenatedAddress,
    city: validatedResult.data.city,
    countryId: validatedResult.data.countryId,
    country: country.name,
    postalZipCode: validatedResult.data.postalZipCode,
    provinceStateId: validatedResult.data.provinceStateId,
    provinceState: validatedResult.data.provinceStateId && provinceTerritoryState.abbr,
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
    const provinceTerritoryState = await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateByCode(addressCorrectionResult.provinceCode, locale);
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

  await appContainer.get(TYPES.ProfileService).updateHomeAddress(homeAddress);
  return redirect(getPathById('protected/profile/contact-information', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function EditHomeAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState.country ?? CANADA_COUNTRY_ID);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);
  const [addressDialogContent, setAddressDialogContent] = useState<AddressResponse | null>(null);

  //TODO: hook in errors from action when available
  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    address: 'home-address',
    unitNumber: 'unit-number',
    city: 'home-city',
    postalZipCode: 'home-postal-code',
    provinceStateId: 'home-province',
    countryId: 'home-country',
    syncAddresses: 'sync-addresses',
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

  const dummyOption: InputOptionProps = { children: t('protected-profile:home-address.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedHomeCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <div className="space-y-6">
            <InputSanitizeField
              id="home-address"
              name="address"
              className="w-full"
              label={t('protected-profile:home-address.address')}
              maxLength={100}
              helpMessagePrimary={t('protected-profile:home-address.address-help')}
              helpMessagePrimaryClassName="text-black"
              autoComplete="address-line1"
              defaultValue={defaultState.address}
              errorMessage={errors?.address}
              required
            />
            <InputSanitizeField
              id="unit-number"
              name="unitNumber"
              className="w-full"
              label={t('protected-profile:home-address.unit-number')}
              maxLength={100}
              helpMessagePrimary={t('protected-profile:home-address.unit-number-help')}
              helpMessagePrimaryClassName="text-black"
              autoComplete="address-line2"
              errorMessage={errors?.unitNumber}
            />
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField id="home-city" name="city" className="w-full" label={t('protected-profile:home-address.city')} maxLength={100} autoComplete="address-level2" defaultValue={defaultState.city} errorMessage={errors?.city} required />
              <InputSanitizeField
                id="home-postal-code"
                name="postalZipCode"
                className="w-full"
                label={isPostalCodeRequired ? t('protected-profile:home-address.postal-code') : t('protected-profile:home-address.postal-code-optional')}
                maxLength={100}
                autoComplete="postal-code"
                defaultValue={defaultState.postalCode}
                errorMessage={errors?.postalZipCode}
                required={isPostalCodeRequired}
              />
            </div>

            {homeRegions.length > 0 && (
              <InputSelect
                id="home-province"
                name="provinceStateId"
                className="w-full sm:w-1/2"
                label={t('protected-profile:home-address.province')}
                defaultValue={defaultState.province}
                errorMessage={errors?.provinceStateId}
                options={[dummyOption, ...homeRegions]}
                required
              />
            )}
            <InputSelect
              id="home-country"
              name="countryId"
              className="w-full sm:w-1/2"
              label={t('protected-profile:home-address.country')}
              autoComplete="country"
              defaultValue={defaultState.country}
              errorMessage={errors?.countryId}
              options={countries}
              onChange={homeCountryChangeHandler}
              required
            />
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Continue - Home address click"
              >
                {t('protected-profile:home-address.save-btn')}
              </LoadingButton>
            </DialogTrigger>
            {!isSubmitting && addressDialogContent && (
              <>
                {addressDialogContent.status === 'address-suggestion' && (
                  <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} formAction={FORM_ACTION.useSelectedAddress} />
                )}
                {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} formAction={FORM_ACTION.useInvalidAddress} />}
              </>
            )}
          </Dialog>
          <ButtonLink id="back-button" routeId="protected/profile/contact-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Home address click">
            {t('protected-profile:home-address.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

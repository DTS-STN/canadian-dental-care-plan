import { useEffect, useMemo, useState } from 'react';

import { data, redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-mailing-address';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmMailingAddress,
  pageTitleI18nKey: 'protected-renew:update-address.mailing-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = await appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:update-address.mailing-address.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.confirm-mailing-address', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      ...state.mailingAddress,
      isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress,
    },
    countryList,
    regionList,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  const locale = getLocale(request);

  const addressValidationService = appContainer.get(TYPES.domain.services.AddressValidationService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  const { CANADA_COUNTRY_ID } = appContainer.get(TYPES.configs.ClientConfig);

  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const idToken: IdToken = session.get('idToken');
  const isCopyMailingToHome = formData.get('syncAddresses') === 'true';

  const mailingAddressValidator = appContainer.get(TYPES.routes.validators.MailingAddressValidatorFactory).createMailingAddressValidator(locale);
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

  const isNotCanada = validatedResult.data.countryId !== CANADA_COUNTRY_ID;
  const isUseInvalidAddressAction = formAction === FORM_ACTION.useInvalidAddress;
  const isUseSelectedAddressAction = formAction === FORM_ACTION.useSelectedAddress;
  const canProceedToReview = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToReview) {
    saveProtectedRenewState({
      params,
      request,
      session,
      state: {
        mailingAddress,
        isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
        ...(homeAddress && { homeAddress }), // Only include if homeAddress is defined
      },
    });

    appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.confirm-mailing-address', { userId: idToken.sub });

    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  // Validate Canadian adddress
  invariant(validatedResult.data.postalZipCode, 'Postal zip code is required for Canadian addresses');
  invariant(validatedResult.data.provinceStateId, 'Province state is required for Canadian addresses');

  const country = await countryService.getLocalizedCountryById(validatedResult.data.countryId, locale);

  // Build the address object using validated data, transforming unique identifiers
  const formattedMailingAddress: CanadianAddress = {
    address: validatedResult.data.address,
    city: validatedResult.data.city,
    countryId: validatedResult.data.countryId,
    country: country.name,
    postalZipCode: validatedResult.data.postalZipCode,
    provinceStateId: validatedResult.data.provinceStateId,
    provinceState: validatedResult.data.provinceStateId && provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(validatedResult.data.provinceStateId, locale).abbr,
  };

  const addressCorrectionResult = await addressValidationService.getAddressCorrectionResult({
    address: formattedMailingAddress.address,
    city: formattedMailingAddress.city,
    postalCode: formattedMailingAddress.postalZipCode,
    provinceCode: formattedMailingAddress.provinceState,
    userId: idToken.sub,
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

  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      mailingAddress,
      isHomeAddressSameAsMailingAddress: isCopyMailingToHome,
      ...(homeAddress && { homeAddress }), // Only include if homeAddress is defined
    },
  });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function ProtectedRenewConfirmMailingAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList } = loaderData;
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();

  const fetcher = useEnhancedFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState.country ?? CANADA_COUNTRY_ID);
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

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions = useMemo<InputOptionProps[]>(() => mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id })), [mailingCountryRegions]);
  const dummyOption: InputOptionProps = { children: t('protected-renew:update-address.address-field.select-one'), value: '' };
  const mailingPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedMailingCountry);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="space-y-6">
          <InputSanitizeField
            id="mailing-address"
            name="address"
            className="w-full"
            label={t('protected-renew:update-address.address-field.mailing-address')}
            maxLength={100}
            helpMessagePrimary={t('protected-renew:update-address.address-field.address-note')}
            helpMessagePrimaryClassName="text-black"
            autoComplete="address-line1"
            defaultValue={defaultState.address}
            errorMessage={errors?.address}
            required
          />
          <div className="grid items-end gap-6 md:grid-cols-2">
            <InputSanitizeField
              id="mailing-city"
              name="city"
              className="w-full"
              label={t('protected-renew:update-address.address-field.city')}
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
              label={mailingPostalCodeRequired ? t('protected-renew:update-address.address-field.postal-code') : t('protected-renew:update-address.address-field.postal-code-optional')}
              maxLength={100}
              autoComplete="postal-code"
              defaultValue={defaultState.postalCode}
              errorMessage={errors?.postalZipCode}
              required={mailingPostalCodeRequired}
            />
          </div>
          {mailingRegions.length > 0 && (
            <InputSelect
              id="mailing-province"
              name="provinceStateId"
              className="w-full sm:w-1/2"
              label={t('protected-renew:update-address.address-field.province')}
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
            label={t('protected-renew:update-address.address-field.country')}
            autoComplete="country"
            defaultValue={defaultState.country}
            errorMessage={errors?.countryId}
            options={countries}
            onChange={mailingCountryChangeHandler}
            required
          />
          <InputCheckbox id="sync-addresses" name="syncAddresses" value="true" checked={copyAddressChecked} onChange={checkHandler}>
            {t('protected-renew:update-address.home-address.use-mailing-address')}
          </InputCheckbox>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
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
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Mailing address click"
                >
                  {t('protected-renew:update-address.save-btn')}
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
          </div>
          <ButtonLink id="cancel-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Mailing address click">
            {t('protected-renew:update-address.cancel-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

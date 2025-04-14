import { useEffect, useMemo, useState } from 'react';

import { data, redirect } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/home-address';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import type { AddressInvalidResponse, AddressResponse, AddressSuggestionResponse, CanadianAddress } from '~/components/address-validation-dialog';
import { AddressInvalidDialogContent, AddressSuggestionDialogContent } from '~/components/address-validation-dialog';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogTrigger } from '~/components/dialog';
import { useErrorSummary } from '~/components/error-summary';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.homeAddress,
  pageTitleI18nKey: 'protected-apply-adult-child:address.home-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const countryList = appContainer.get(TYPES.domain.services.CountryService).listAndSortLocalizedCountries(locale);
  const regionList = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService).listAndSortLocalizedProvinceTerritoryStates(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:address.home-address.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult-child.home-address', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.adult-child.home-address', 200);

  return {
    meta,
    defaultState: state,
    countryList,
    regionList,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();
  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  const locale = getLocale(request);

  const clientConfig = appContainer.get(TYPES.configs.ClientConfig);
  const addressValidationService = appContainer.get(TYPES.domain.services.AddressValidationService);
  const countryService = appContainer.get(TYPES.domain.services.CountryService);
  const provinceTerritoryStateService = appContainer.get(TYPES.domain.services.ProvinceTerritoryStateService);

  securityHandler.validateCsrfToken({ formData, session });
  const state = loadProtectedApplyAdultChildState({ params, request, session });

  if (formAction === FORM_ACTION.cancel) {
    instrumentationService.countHttpStatus('protected.apply.adult-child.home-address', 302);
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }

  const homeAddressValidator = appContainer.get(TYPES.routes.validators.HomeAddressValidatorFactory).createHomeAddressValidator(locale);

  const parsedDataResult = await homeAddressValidator.validateHomeAddress({
    address: String(formData.get('address')),
    countryId: String(formData.get('countryId')),
    provinceStateId: formData.get('provinceStateId') ? String(formData.get('provinceStateId')) : undefined,
    city: String(formData.get('city')),
    postalZipCode: formData.get('postalZipCode') ? String(formData.get('postalZipCode')) : undefined,
  });

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('protected.apply.adult-child.home-address', 400);
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
  const isUseInvalidAddressAction = formAction === FORM_ACTION.useInvalidAddress;
  const isUseSelectedAddressAction = formAction === FORM_ACTION.useSelectedAddress;
  const canProceedToDental = isNotCanada || isUseInvalidAddressAction || isUseSelectedAddressAction;

  if (canProceedToDental) {
    saveProtectedApplyState({ params, session, state: { homeAddress, isHomeAddressSameAsMailingAddress: false } });

    instrumentationService.countHttpStatus('protected.apply.adult-child.home-address', 302);

    if (state.editMode) {
      return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
    }
    return redirect(getPathById('protected/apply/$id/adult-child/phone-number', params));
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
    instrumentationService.countHttpStatus('protected.apply.adult-child.home-address.address-invalid', 200);
    return {
      invalidAddress: formattedHomeAddress,
      status: 'address-invalid',
    } as const satisfies AddressInvalidResponse;
  }

  if (addressCorrectionResult.status === 'corrected') {
    const provinceTerritoryState = provinceTerritoryStateService.getLocalizedProvinceTerritoryStateByCode(addressCorrectionResult.provinceCode, locale);
    instrumentationService.countHttpStatus('protected.apply.adult-child.home-address.address-suggestion', 200);
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
  saveProtectedApplyState({ params, session, state: { homeAddress, isHomeAddressSameAsMailingAddress: false } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult-child.home-address', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.adult-child.home-address', 302);

  if (state.editMode) {
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }
  return redirect(getPathById('protected/apply/$id/adult-child/phone-number', params));
}

function isAddressResponse(data: unknown): data is AddressResponse {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string';
}

export default function ApplyAdultChildHomeAddress({ loaderData, params }: Route.ComponentProps) {
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
    city: 'home-city',
    postalZipCode: 'home-postal-code',
    provinceStateId: 'home-province',
    countryId: 'home-country',
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

  const dummyOption: InputOptionProps = { children: t('protected-apply-adult-child:address.address-field.select-one'), value: '' };

  const isPostalCodeRequired = [CANADA_COUNTRY_ID, USA_COUNTRY_ID].includes(selectedHomeCountry);
  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={48} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-8">
            <div className="space-y-6">
              <InputSanitizeField
                id="home-address"
                name="address"
                className="w-full"
                label={t('protected-apply-adult-child:address.address-field.address')}
                helpMessagePrimary={t('protected-apply-adult-child:address.address-field.address-note')}
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
                  name="city"
                  className="w-full"
                  label={t('protected-apply-adult-child:address.address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  defaultValue={defaultState.homeAddress?.city}
                  errorMessage={errors?.city}
                  required
                />
                <InputSanitizeField
                  id="home-postal-code"
                  name="postalZipCode"
                  className="w-full"
                  label={isPostalCodeRequired ? t('protected-apply-adult-child:address.address-field.postal-code') : t('protected-apply-adult-child:address.address-field.postal-code-optional')}
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
                  name="provinceStateId"
                  className="w-full sm:w-1/2"
                  label={t('protected-apply-adult-child:address.address-field.province')}
                  defaultValue={defaultState.homeAddress?.province}
                  errorMessage={errors?.provinceStateId}
                  options={[dummyOption, ...homeRegions]}
                  required
                />
              )}
              <InputSelect
                id="home-country"
                name="countryId"
                className="w-full sm:w-1/2"
                label={t('protected-apply-adult-child:address.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState.homeAddress?.country ?? ''}
                errorMessage={errors?.countryId}
                options={countries}
                onChange={homeCountryChangeHandler}
                required
              />
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
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Save - Home address click"
                  >
                    {t('protected-apply-adult-child:address.save-btn')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} formAction={FORM_ACTION.useSelectedAddress} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} formAction={FORM_ACTION.useInvalidAddress} />}
                  </>
                )}
              </Dialog>
              <Button id="cancel-button" name="_action" disabled={isSubmitting} value={FORM_ACTION.cancel} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Cancel - Home address click">
                {t('protected-apply-adult-child:address.cancel-btn')}
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
                    data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Continue - Home address click"
                  >
                    {t('protected-apply-adult-child:address.continue')}
                  </LoadingButton>
                </DialogTrigger>
                {!fetcher.isSubmitting && addressDialogContent && (
                  <>
                    {addressDialogContent.status === 'address-suggestion' && (
                      <AddressSuggestionDialogContent enteredAddress={addressDialogContent.enteredAddress} suggestedAddress={addressDialogContent.suggestedAddress} formAction={FORM_ACTION.useSelectedAddress} />
                    )}
                    {addressDialogContent.status === 'address-invalid' && <AddressInvalidDialogContent invalidAddress={addressDialogContent.invalidAddress} formAction={FORM_ACTION.useInvalidAddress} />}
                  </>
                )}
              </Dialog>
              <ButtonLink
                id="back-button"
                routeId={`protected/apply/$id/adult-child/mailing-address`}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Home address click"
              >
                {t('protected-apply-adult-child:address.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

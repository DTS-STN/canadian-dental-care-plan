import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import type { AddressInformationState } from '~/.server/routes/helpers/renew-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/.server/utils/postal-zip-code.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.updateAddress,
  pageTitleI18nKey: 'renew-ita:update-address.page-title',
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

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:update-address.page-title') }) };

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

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const addressInformationSchema = z
    .object({
      homeAddress: z.string().trim().max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homeApartment: z.string().trim().max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homeCountry: z.string().trim().optional(),
      homeProvince: z.string().trim().optional(),
      homeCity: z.string().trim().max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homePostalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (!val.homeAddress || validator.isEmpty(val.homeAddress)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.address-required'), path: ['homeAddress'] });
      }

      if (!val.homeCountry || validator.isEmpty(val.homeCountry)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.country-required'), path: ['homeCountry'] });
      }

      if (!val.homeCity || validator.isEmpty(val.homeCity)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.city-required'), path: ['homeCity'] });
      }

      if (val.homeCountry === CANADA_COUNTRY_ID || val.homeCountry === USA_COUNTRY_ID) {
        if (!val.homeProvince || validator.isEmpty(val.homeProvince)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.province-required'), path: ['homeProvince'] });
        }
        if (!val.homePostalCode || validator.isEmpty(val.homePostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.postal-code-required'), path: ['homePostalCode'] });
        } else if (!isValidPostalCode(val.homeCountry, val.homePostalCode)) {
          const message = val.homeCountry === CANADA_COUNTRY_ID ? t('renew-ita:update-address.error-message.home-address.postal-code-valid') : t('renew-ita:update-address.error-message.home-address.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['homePostalCode'] });
        } else if (val.homeCountry === CANADA_COUNTRY_ID && val.homeProvince && !isValidCanadianPostalCode(val.homeProvince, val.homePostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.invalid-postal-code-for-province'), path: ['homePostalCode'] });
        }
      }

      if (val.homeCountry && val.homeCountry !== CANADA_COUNTRY_ID && val.homePostalCode && isValidPostalCode(CANADA_COUNTRY_ID, val.homePostalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.home-address.invalid-postal-code-for-country'), path: ['homeCountry'] });
      }
    })
    .transform((val) => ({
      ...val,
      homePostalCode: val.homeCountry && val.homePostalCode ? formatPostalCode(val.homeCountry, val.homePostalCode) : val.homePostalCode,
    })) satisfies z.ZodType<AddressInformationState>;

  const parsedDataResult = addressInformationSchema.safeParse({
    homeAddress: formData.get('homeAddress') ? String(formData.get('homeAddress')) : undefined,
    homeApartment: formData.get('homeApartment') ? String(formData.get('homeApartment')) : undefined,
    homeCountry: formData.get('homeCountry') ? String(formData.get('homeCountry')) : undefined,
    homeProvince: formData.get('homeProvince') ? String(formData.get('homeProvince')) : undefined,
    homeCity: formData.get('homeCity') ? String(formData.get('homeCity')) : undefined,
    homePostalCode: formData.get('homePostalCode') ? String(formData.get('homePostalCode')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { addressInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/dental-insurance', params));
}

export default function RenewItaUpdateAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, countryList, regionList, editMode } = useLoaderData<typeof loader>();
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useClientEnv();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState.addressInformation?.homeCountry ?? CANADA_COUNTRY_ID);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    homeAddress: 'home-address',
    homeApartment: 'home-apartment',
    homeProvince: 'home-province',
    homeCountry: 'home-country',
    homeCity: 'home-city',
    homePostalCode: 'home-postal-code',
  });

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedHomeCountry);
    setHomeCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedHomeCountry, regionList]);

  const homeCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedHomeCountry(event.currentTarget.value);
  };

  // populate home region/province/state list with selected country or current address country
  const homeRegions: InputOptionProps[] = homeCountryRegions.map(({ id, name }) => ({ children: name, value: id }));

  const dummyOption: InputOptionProps = { children: t('renew-ita:update-address.address-field.select-one'), value: '' };

  const postalCodeRequiredContries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const homePostalCodeRequired = postalCodeRequiredContries.includes(selectedHomeCountry);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-ita:update-address.home-address.header')}</legend>
            <div className="space-y-6">
              <>
                <InputSanitizeField
                  id="home-address"
                  name="homeAddress"
                  className="w-full"
                  label={t('renew-ita:update-address.address-field.address')}
                  helpMessagePrimary={t('renew-ita:update-address.address-field.address-note')}
                  helpMessagePrimaryClassName="text-black"
                  maxLength={30}
                  autoComplete="address-line1"
                  defaultValue={defaultState.addressInformation?.homeAddress ?? ''}
                  errorMessage={errors?.homeAddress}
                  required
                />
                <InputSanitizeField
                  id="home-apartment"
                  name="homeApartment"
                  className="w-full"
                  label={t('renew-ita:update-address.address-field.apartment')}
                  maxLength={30}
                  autoComplete="address-line2"
                  defaultValue={defaultState.addressInformation?.homeApartment ?? ''}
                  errorMessage={errors?.homeApartment}
                />
                <InputSelect
                  id="home-country"
                  name="homeCountry"
                  className="w-full sm:w-1/2"
                  label={t('renew-ita:update-address.address-field.country')}
                  autoComplete="country"
                  defaultValue={defaultState.addressInformation?.homeCountry ?? ''}
                  errorMessage={errors?.homeCountry}
                  options={countries}
                  onChange={homeCountryChangeHandler}
                  required
                />
                {homeRegions.length > 0 && (
                  <InputSelect
                    id="home-province"
                    name="homeProvince"
                    className="w-full sm:w-1/2"
                    label={t('renew-ita:update-address.address-field.province')}
                    defaultValue={defaultState.addressInformation?.homeProvince ?? ''}
                    errorMessage={errors?.homeProvince}
                    options={[dummyOption, ...homeRegions]}
                    required
                  />
                )}
                <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
                  <InputSanitizeField
                    id="home-city"
                    name="homeCity"
                    className="w-full"
                    label={t('renew-ita:update-address.address-field.city')}
                    maxLength={100}
                    autoComplete="address-level2"
                    defaultValue={defaultState.addressInformation?.homeCity ?? ''}
                    errorMessage={errors?.homeCity}
                    required
                  />
                  <InputSanitizeField
                    id="home-postal-code"
                    name="homePostalCode"
                    className="w-full"
                    label={homePostalCodeRequired ? t('renew-ita:update-address.address-field.postal-code') : t('renew-ita:update-address.address-field.postal-code-optional')}
                    maxLength={100}
                    autoComplete="postal-code"
                    defaultValue={defaultState.addressInformation?.homePostalCode ?? ''}
                    errorMessage={errors?.homePostalCode}
                    required={homePostalCodeRequired}
                  />
                </div>
              </>
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Update address click">
                {t('renew-ita:update-address.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Update address click">
                {t('renew-ita:update-address.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Update address click">
                {t('renew-ita:update-address.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={defaultState.hasAddressChanged ? `public/renew/$id/ita/update-mailing-address` : `public/renew/$id/ita/confirm-address`}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Update home address click"
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

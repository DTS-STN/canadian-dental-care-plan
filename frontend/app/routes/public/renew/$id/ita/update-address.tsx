import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import type { InputOptionProps } from '~/components/input-option';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewItaState } from '~/route-helpers/renew-ita-route-helpers.server';
import type { AddressInformationState } from '~/route-helpers/renew-route-helpers.server';
import { saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidCanadianPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.updateAddress,
  pageTitleI18nKey: 'renew-ita:update-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = configProvider.getServerConfig();

  const countryList = serviceProvider.getCountryService().listAndSortLocalizedCountries(locale);
  const regionList = serviceProvider.getProvinceTerritoryStateService().listAndSortLocalizedProvinceTerritoryStates(locale);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:update-address.page-title') }) };

  return json({
    id: state.id,
    csrfToken,
    meta,
    defaultState: state.addressInformation,
    countryList,
    regionList,
    CANADA_COUNTRY_ID,
    USA_COUNTRY_ID,
    editMode: state.editMode,
  });
}

export async function action({ context: { configProvider, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/update-address');

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = configProvider.getServerConfig();

  const addressInformationSchema = z
    .object({
      mailingAddress: z.string().trim().min(1, t('renew-ita:update-address.error-message.mailing-address.address-required')).max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')),
      mailingApartment: z.string().trim().max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      mailingCountry: z.string().trim().min(1, t('renew-ita:update-address.error-message.mailing-address.country-required')),
      mailingProvince: z.string().trim().min(1, t('renew-ita:update-address.error-message.mailing-address.province-required')).optional(),
      mailingCity: z.string().trim().min(1, t('renew-ita:update-address.error-message.mailing-address.city-required')).max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')),
      mailingPostalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      copyMailingAddress: z.boolean(),
      homeAddress: z.string().trim().max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homeApartment: z.string().trim().max(30).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homeCountry: z.string().trim().optional(),
      homeProvince: z.string().trim().optional(),
      homeCity: z.string().trim().max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
      homePostalCode: z.string().trim().max(100).refine(isAllValidInputCharacters, t('renew-ita:update-address.error-message.characters-valid')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.mailingCountry === CANADA_COUNTRY_ID || val.mailingCountry === USA_COUNTRY_ID) {
        if (!val.mailingProvince || validator.isEmpty(val.mailingProvince)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.mailing-address.province-required'), path: ['mailingProvince'] });
        }
        if (!val.mailingPostalCode || validator.isEmpty(val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.mailing-address.postal-code-required'), path: ['mailingPostalCode'] });
        } else if (!isValidPostalCode(val.mailingCountry, val.mailingPostalCode)) {
          const message = val.mailingCountry === CANADA_COUNTRY_ID ? t('renew-ita:update-address.error-message.mailing-address.postal-code-valid') : t('renew-ita:update-address.error-message.mailing-address.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['mailingPostalCode'] });
        } else if (val.mailingCountry === CANADA_COUNTRY_ID && val.mailingProvince && !isValidCanadianPostalCode(val.mailingProvince, val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.mailing-address.invalid-postal-code-for-province'), path: ['mailingPostalCode'] });
        }
      }

      if (val.mailingCountry && val.mailingCountry !== CANADA_COUNTRY_ID && val.mailingPostalCode && isValidPostalCode(CANADA_COUNTRY_ID, val.mailingPostalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:update-address.error-message.mailing-address.invalid-postal-code-for-country'), path: ['mailingCountry'] });
      }

      if (val.copyMailingAddress === false) {
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
      }
    })
    .transform((val) => ({
      ...val,
      homePostalCode: val.homeCountry && val.homePostalCode ? formatPostalCode(val.homeCountry, val.homePostalCode) : val.homePostalCode,
      mailingPostalCode: val.mailingCountry && val.mailingPostalCode ? formatPostalCode(val.mailingCountry, val.mailingPostalCode) : val.mailingPostalCode,
    })) satisfies z.ZodType<AddressInformationState>;

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    mailingAddress: String(formData.get('mailingAddress') ?? ''),
    mailingApartment: formData.get('mailingApartment') ? String(formData.get('mailingApartment')) : undefined,
    mailingCountry: String(formData.get('mailingCountry') ?? ''),
    mailingProvince: formData.get('mailingProvince') ? String(formData.get('mailingProvince')) : undefined,
    mailingCity: String(formData.get('mailingCity') ?? ''),
    mailingPostalCode: formData.get('mailingPostalCode') ? String(formData.get('mailingPostalCode')) : undefined,
    copyMailingAddress: formData.get('copyMailingAddress') === 'copy',
    homeAddress: formData.get('homeAddress') ? String(formData.get('homeAddress')) : undefined,
    homeApartment: formData.get('homeApartment') ? String(formData.get('homeApartment')) : undefined,
    homeCountry: formData.get('homeCountry') ? String(formData.get('homeCountry')) : undefined,
    homeProvince: formData.get('homeProvince') ? String(formData.get('homeProvince')) : undefined,
    homeCity: formData.get('homeCity') ? String(formData.get('homeCity')) : undefined,
    homePostalCode: formData.get('homePostalCode') ? String(formData.get('homePostalCode')) : undefined,
  };
  const parsedDataResult = addressInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  const updatedData = parsedDataResult.data.copyMailingAddress
    ? {
        ...parsedDataResult.data,
        homeAddress: parsedDataResult.data.mailingAddress,
        homeApartment: parsedDataResult.data.mailingApartment,
        homeCountry: parsedDataResult.data.mailingCountry,
        homeProvince: parsedDataResult.data.mailingProvince,
        homeCity: parsedDataResult.data.mailingCity,
        homePostalCode: parsedDataResult.data.mailingPostalCode,
      }
    : parsedDataResult.data;

  saveRenewState({ params, session, state: { addressInformation: updatedData } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/dental-insurance', params));
}

export default function RenewItaUpdateAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, countryList, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState?.mailingCountry ?? CANADA_COUNTRY_ID);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState?.copyMailingAddress === true);
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState?.homeCountry ?? CANADA_COUNTRY_ID);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
    email: 'email',
    confirmEmail: 'confirm-email',
    mailingAddress: 'mailing-address',
    mailingApartment: 'mailing-apartment',
    mailingProvince: 'mailing-province',
    mailingCountry: 'mailing-country',
    mailingCity: 'mailing-city',
    mailingPostalCode: 'mailing-postal-code',
    copyMailingAddress: 'copy-mailing-address',
    homeAddress: 'home-address',
    homeApartment: 'home-apartment',
    homeProvince: 'home-province',
    homeCountry: 'home-country',
    homeCity: 'home-city',
    homePostalCode: 'home-postal-code',
  });

  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };

  useEffect(() => {
    const filteredProvinceTerritoryStates = regionList.filter(({ countryId }) => countryId === selectedMailingCountry);
    setMailingCountryRegions(filteredProvinceTerritoryStates);
  }, [selectedMailingCountry, regionList]);

  const mailingCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedMailingCountry(event.currentTarget.value);
  };

  const countries = useMemo<InputOptionProps[]>(() => {
    return countryList.map(({ id, name }) => ({ children: name, value: id }));
  }, [countryList]);

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions: InputOptionProps[] = mailingCountryRegions.map(({ id, name }) => ({ children: name, value: id }));

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
  const mailingPostalCodeRequired = postalCodeRequiredContries.includes(selectedMailingCountry);
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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-ita:update-address.mailing-address.header')}</legend>
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
                defaultValue={defaultState?.mailingAddress ?? ''}
                errorMessage={errors?.mailingAddress}
                required
              />
              <InputSanitizeField
                id="mailing-apartment"
                name="mailingApartment"
                className="w-full"
                label={t('renew-ita:update-address.address-field.apartment')}
                maxLength={30}
                autoComplete="address-line2"
                defaultValue={defaultState?.mailingApartment ?? ''}
                errorMessage={errors?.mailingApartment}
              />
              <InputSelect
                id="mailing-country"
                name="mailingCountry"
                className="w-full sm:w-1/2"
                label={t('renew-ita:update-address.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState?.mailingCountry ?? ''}
                errorMessage={errors?.mailingCountry}
                options={countries}
                onChange={mailingCountryChangeHandler}
                required
              />
              {mailingRegions.length > 0 && (
                <InputSelect
                  id="mailing-province"
                  name="mailingProvince"
                  className="w-full sm:w-1/2"
                  label={t('renew-ita:update-address.address-field.province')}
                  defaultValue={defaultState?.mailingProvince ?? ''}
                  errorMessage={errors?.mailingProvince}
                  options={[dummyOption, ...mailingRegions]}
                  required
                />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputSanitizeField
                  id="mailing-city"
                  name="mailingCity"
                  className="w-full"
                  label={t('renew-ita:update-address.address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  defaultValue={defaultState?.mailingCity ?? ''}
                  errorMessage={errors?.mailingCity}
                  required
                />
                <InputSanitizeField
                  id="mailing-postal-code"
                  name="mailingPostalCode"
                  className="w-full"
                  label={mailingPostalCodeRequired ? t('renew-ita:update-address.address-field.postal-code') : t('renew-ita:update-address.address-field.postal-code-optional')}
                  maxLength={100}
                  autoComplete="postal-code"
                  defaultValue={defaultState?.mailingPostalCode ?? ''}
                  errorMessage={errors?.mailingPostalCode}
                  required={mailingPostalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-ita:update-address.home-address.header')}</legend>
            <div className="space-y-6">
              <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" value="copy" checked={copyAddressChecked} onChange={checkHandler}>
                {t('renew-ita:update-address.home-address.use-mailing-address')}
              </InputCheckbox>
              {!copyAddressChecked && (
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
                    defaultValue={defaultState?.homeAddress ?? ''}
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
                    defaultValue={defaultState?.homeApartment ?? ''}
                    errorMessage={errors?.homeApartment}
                  />
                  <InputSelect
                    id="home-country"
                    name="homeCountry"
                    className="w-full sm:w-1/2"
                    label={t('renew-ita:update-address.address-field.country')}
                    autoComplete="country"
                    defaultValue={defaultState?.homeCountry ?? ''}
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
                      defaultValue={defaultState?.homeProvince ?? ''}
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
                      defaultValue={defaultState?.homeCity ?? ''}
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
                      defaultValue={defaultState?.homePostalCode ?? ''}
                      errorMessage={errors?.homePostalCode}
                      required={homePostalCodeRequired}
                    />
                  </div>
                </>
              )}
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
                routeId="public/renew/$id/ita/confirm-address"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Update address click"
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

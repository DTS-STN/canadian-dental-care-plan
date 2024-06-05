import { useEffect, useMemo, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputOptionProps } from '~/components/input-option';
import { InputPhoneField } from '~/components/input-phone-field';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { loadApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { PersonalInformationState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.personalInformation,
  pageTitleI18nKey: 'apply-adult:contact-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const lookupService = getLookupService();
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID, MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED } = getEnv();

  const countryList = lookupService.getAllCountries();
  const regionList = lookupService.getAllRegions();

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:contact-information.page-title') }) };

  return json({
    id: state.id,
    csrfToken,
    meta,
    defaultState: state.personalInformation,
    maritalStatus: state.applicantInformation?.maritalStatus,
    countryList,
    regionList,
    CANADA_COUNTRY_ID,
    USA_COUNTRY_ID,
    MARITAL_STATUS_CODE_COMMONLAW,
    MARITAL_STATUS_CODE_MARRIED,
    editMode: state.editMode,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/personal-information');

  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID, COMMUNICATION_METHOD_EMAIL_ID } = getEnv();

  const personalInformationSchema = z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('apply-adult:contact-information.error-message.phone-number-valid'))
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('apply-adult:contact-information.error-message.phone-number-alt-valid'))
        .optional(),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
      mailingAddress: z.string().trim().min(1, t('apply-adult:contact-information.error-message.mailing-address.address-required')).max(30),
      mailingApartment: z.string().trim().max(30).optional(),
      mailingCountry: z.string().trim().min(1, t('apply-adult:contact-information.error-message.mailing-address.country-required')),
      mailingProvince: z.string().trim().min(1, t('apply-adult:contact-information.error-message.mailing-address.province-required')).optional(),
      mailingCity: z.string().trim().min(1, t('apply-adult:contact-information.error-message.mailing-address.city-required')).max(100),
      mailingPostalCode: z.string().trim().max(100).optional(),
      copyMailingAddress: z.boolean(),
      homeAddress: z.string().trim().max(30).optional(),
      homeApartment: z.string().trim().max(30).optional(),
      homeCountry: z.string().trim().optional(),
      homeProvince: z.string().trim().optional(),
      homeCity: z.string().trim().max(100).optional(),
      homePostalCode: z.string().trim().max(100).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.email ?? val.confirmEmail) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.email-valid'), path: ['email'] });
        }

        if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.confirm-email-required'), path: ['confirmEmail'] });
        } else if (!validator.isEmail(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.email-valid'), path: ['confirmEmail'] });
        } else if (val.email !== val.confirmEmail) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.email-match'), path: ['confirmEmail'] });
        }
      }

      if (val.mailingCountry === CANADA_COUNTRY_ID || val.mailingCountry === USA_COUNTRY_ID) {
        if (!val.mailingProvince || validator.isEmpty(val.mailingProvince)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.mailing-address.province-required'), path: ['mailingProvince'] });
        }

        if (!val.mailingPostalCode || validator.isEmpty(val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.mailing-address.postal-code-required'), path: ['mailingPostalCode'] });
        } else if (!isValidPostalCode(val.mailingCountry, val.mailingPostalCode)) {
          const message = val.mailingCountry === CANADA_COUNTRY_ID ? t('apply-adult:contact-information.error-message.mailing-address.postal-code-valid') : t('apply-adult:contact-information.error-message.mailing-address.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['mailingPostalCode'] });
        }
      }

      if (val.copyMailingAddress === false) {
        if (!val.homeAddress || validator.isEmpty(val.homeAddress)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.home-address.address-required'), path: ['homeAddress'] });
        }

        if (!val.homeCountry || validator.isEmpty(val.homeCountry)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.home-address.country-required'), path: ['homeCountry'] });
        }

        if (!val.homeCity || validator.isEmpty(val.homeCity)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.home-address.city-required'), path: ['homeCity'] });
        }

        if (val.homeCountry === CANADA_COUNTRY_ID || val.homeCountry === USA_COUNTRY_ID) {
          if (!val.homeProvince || validator.isEmpty(val.homeProvince)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.home-address.province-required'), path: ['homeProvince'] });
          }

          if (!val.homePostalCode || validator.isEmpty(val.homePostalCode)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:contact-information.error-message.home-address.postal-code-required'), path: ['homePostalCode'] });
          } else if (!isValidPostalCode(val.homeCountry, val.homePostalCode)) {
            const message = val.homeCountry === CANADA_COUNTRY_ID ? t('apply-adult:contact-information.error-message.home-address.postal-code-valid') : t('apply-adult:contact-information.error-message.home-address.zip-code-valid');
            ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['homePostalCode'] });
          }
        }
      }
    })
    .transform((val) => ({
      ...val,
      homePostalCode: val.homeCountry && val.homePostalCode ? formatPostalCode(val.homeCountry, val.homePostalCode) : val.homePostalCode,
      mailingPostalCode: val.mailingCountry && val.mailingPostalCode ? formatPostalCode(val.mailingCountry, val.mailingPostalCode) : val.mailingPostalCode,
      phoneNumber: val.phoneNumber ? parsePhoneNumber(val.phoneNumber, 'CA').formatInternational() : val.phoneNumber,
      phoneNumberAlt: val.phoneNumberAlt ? parsePhoneNumber(val.phoneNumberAlt, 'CA').formatInternational() : val.phoneNumberAlt,
    })) satisfies z.ZodType<PersonalInformationState>;

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail')) : undefined,
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
  const parsedDataResult = personalInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
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

  saveApplyState({ params, session, state: { personalInformation: updatedData } });

  // if email is defined and comm. pref. preferredMethod is EMAIL then sync email
  if (updatedData.email && state.communicationPreferences?.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
    saveApplyState({ params, session, state: { communicationPreferences: { ...state.communicationPreferences, email: updatedData.email } } });
  }

  if (state.editMode) {
    return redirect(getPathById('$lang/_public/apply/$id/adult/review-information', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/adult/communication-preference', params));
}

export default function ApplyFlowPersonalInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, countryList, maritalStatus, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID, MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(defaultState?.mailingCountry);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(defaultState?.copyMailingAddress === true);
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(defaultState?.homeCountry);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'phone-number': fetcher.data?.errors.phoneNumber?._errors[0],
      'phone-number-alt': fetcher.data?.errors.phoneNumberAlt?._errors[0],
      email: fetcher.data?.errors.email?._errors[0],
      'confirm-email': fetcher.data?.errors.confirmEmail?._errors[0],
      'mailing-address': fetcher.data?.errors.mailingAddress?._errors[0],
      'mailing-apartment': fetcher.data?.errors.mailingApartment?._errors[0],
      'mailing-province': fetcher.data?.errors.mailingProvince?._errors[0],
      'mailing-country': fetcher.data?.errors.mailingCountry?._errors[0],
      'mailing-city': fetcher.data?.errors.mailingCity?._errors[0],
      'mailing-postal-code': fetcher.data?.errors.mailingPostalCode?._errors[0],
      'copy-mailing-address': fetcher.data?.errors.copyMailingAddress?._errors[0],
      'home-address': fetcher.data?.errors.homeAddress?._errors[0],
      'home-apartment': fetcher.data?.errors.homeApartment?._errors[0],
      'home-province': fetcher.data?.errors.homeProvince?._errors[0],
      'home-country': fetcher.data?.errors.homeCountry?._errors[0],
      'home-city': fetcher.data?.errors.homeCity?._errors[0],
      'home-postal-code': fetcher.data?.errors.homePostalCode?._errors[0],
    }),
    [
      fetcher.data?.errors.copyMailingAddress?._errors,
      fetcher.data?.errors.homeAddress?._errors,
      fetcher.data?.errors.homeApartment?._errors,
      fetcher.data?.errors.homeCity?._errors,
      fetcher.data?.errors.homeCountry?._errors,
      fetcher.data?.errors.homePostalCode?._errors,
      fetcher.data?.errors.homeProvince?._errors,
      fetcher.data?.errors.mailingAddress?._errors,
      fetcher.data?.errors.mailingApartment?._errors,
      fetcher.data?.errors.mailingCity?._errors,
      fetcher.data?.errors.mailingCountry?._errors,
      fetcher.data?.errors.mailingPostalCode?._errors,
      fetcher.data?.errors.mailingProvince?._errors,
      fetcher.data?.errors.phoneNumber?._errors,
      fetcher.data?.errors.phoneNumberAlt?._errors,
      fetcher.data?.errors.email?._errors,
      fetcher.data?.errors.confirmEmail?._errors,
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.countryId === selectedMailingCountry);
    setMailingCountryRegions(filteredRegions);
  }, [selectedMailingCountry, regionList]);

  const mailingCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedMailingCountry(event.currentTarget.value);
  };

  const countries: InputOptionProps[] = countryList
    .map(({ countryId, nameEn, nameFr }) => {
      return {
        children: i18n.language === 'fr' ? nameFr : nameEn,
        value: countryId,
      };
    })
    .sort((country1, country2) => country1.children.localeCompare(country2.children)) //Sort alphabetically
    .sort((country1, country2) => (country1.value === CANADA_COUNTRY_ID ? -1 : country2.value === CANADA_COUNTRY_ID ? 1 : 0)); //Sort by Canada first

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions: InputOptionProps[] = mailingCountryRegions
    .map(({ provinceTerritoryStateId, nameEn, nameFr }) => {
      return {
        children: i18n.language === 'fr' ? nameFr : nameEn,
        value: provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.countryId === selectedHomeCountry);
    setHomeCountryRegions(filteredRegions);
  }, [selectedHomeCountry, regionList]);

  const homeCountryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedHomeCountry(event.currentTarget.value);
  };

  // populate home region/province/state list with selected country or current address country
  const homeRegions: InputOptionProps[] = homeCountryRegions
    .map(({ provinceTerritoryStateId, nameEn, nameFr }) => {
      return {
        children: i18n.language === 'fr' ? nameFr : nameEn,
        value: provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

  const dummyOption: InputOptionProps = { children: t('apply-adult:contact-information.address-field.select-one'), value: '' };

  const postalCodeRequiredContries = [CANADA_COUNTRY_ID, USA_COUNTRY_ID];
  const mailingPostalCodeRequired = selectedMailingCountry !== undefined && postalCodeRequiredContries.includes(selectedMailingCountry);
  const homePostalCodeRequired = selectedHomeCountry !== undefined && postalCodeRequiredContries.includes(selectedHomeCountry);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={60} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:optional-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:contact-information.phone-header')}</legend>
            <p className="mb-4">{t('apply-adult:contact-information.add-phone')}</p>
            <div className="grid items-end gap-6">
              <InputPhoneField
                id="phone-number"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                className="w-full"
                autoComplete="tel"
                defaultValue={defaultState?.phoneNumber ?? ''}
                errorMessage={errorMessages['phone-number']}
                label={t('apply-adult:contact-information.phone-number')}
                maxLength={100}
                aria-describedby="adding-phone"
              />
              <InputPhoneField
                id="phone-number-alt"
                name="phoneNumberAlt"
                type="tel"
                inputMode="tel"
                className="w-full"
                autoComplete="tel"
                defaultValue={defaultState?.phoneNumberAlt ?? ''}
                errorMessage={errorMessages['phone-number-alt']}
                label={t('apply-adult:contact-information.phone-number-alt')}
                maxLength={100}
                aria-describedby="adding-phone"
              />
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:contact-information.email-header')}</legend>
            <p id="adding-email" className="mb-4">
              {t('apply-adult:contact-information.add-email')}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="email"
                name="email"
                type="email"
                inputMode="email"
                className="w-full"
                autoComplete="email"
                defaultValue={defaultState?.email ?? ''}
                errorMessage={errorMessages['email']}
                label={t('apply-adult:contact-information.email')}
                maxLength={64}
                aria-describedby="adding-email"
              />
              <InputField
                id="confirm-email"
                name="confirmEmail"
                type="email"
                inputMode="email"
                className="w-full"
                autoComplete="email"
                defaultValue={defaultState?.email ?? ''}
                errorMessage={errorMessages['confirm-email']}
                label={t('apply-adult:contact-information.confirm-email')}
                maxLength={64}
                aria-describedby="adding-email"
              />
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:contact-information.mailing-address.header')}</legend>
            <div className="space-y-6">
              <InputField
                id="mailing-address"
                name="mailingAddress"
                className="w-full"
                label={t('apply-adult:contact-information.address-field.address')}
                maxLength={30}
                helpMessagePrimary={t('apply-adult:contact-information.address-field.address-note')}
                helpMessagePrimaryClassName="text-black"
                autoComplete="address-line1"
                defaultValue={defaultState?.mailingAddress ?? ''}
                errorMessage={errorMessages['mailing-address']}
                required
              />
              <InputField
                id="mailing-apartment"
                name="mailingApartment"
                className="w-full"
                label={t('apply-adult:contact-information.address-field.apartment')}
                maxLength={30}
                autoComplete="address-line2"
                defaultValue={defaultState?.mailingApartment ?? ''}
                errorMessage={errorMessages['mailing-apartment']}
              />
              <InputSelect
                id="mailing-country"
                name="mailingCountry"
                className="w-full sm:w-1/2"
                label={t('apply-adult:contact-information.address-field.country')}
                autoComplete="country"
                defaultValue={defaultState?.mailingCountry ?? ''}
                errorMessage={errorMessages['mailing-country']}
                options={[dummyOption, ...countries]}
                onChange={mailingCountryChangeHandler}
                required
              />
              {mailingRegions.length > 0 && (
                <InputSelect
                  id="mailing-province"
                  name="mailingProvince"
                  className="w-full sm:w-1/2"
                  label={t('apply-adult:contact-information.address-field.province')}
                  defaultValue={defaultState?.mailingProvince ?? ''}
                  errorMessage={errorMessages['mailing-province']}
                  options={[dummyOption, ...mailingRegions]}
                  required
                />
              )}
              <div className="grid items-end gap-6 md:grid-cols-2">
                <InputField
                  id="mailing-city"
                  name="mailingCity"
                  className="w-full"
                  label={t('apply-adult:contact-information.address-field.city')}
                  maxLength={100}
                  autoComplete="address-level2"
                  defaultValue={defaultState?.mailingCity ?? ''}
                  errorMessage={errorMessages['mailing-city']}
                  required
                />
                <InputField
                  id="mailing-postal-code"
                  name="mailingPostalCode"
                  className="w-full"
                  label={mailingPostalCodeRequired ? t('apply-adult:contact-information.address-field.postal-code') : t('apply-adult:contact-information.address-field.postal-code-optional')}
                  maxLength={100}
                  autoComplete="postal-code"
                  defaultValue={defaultState?.mailingPostalCode}
                  errorMessage={errorMessages['mailing-postal-code']}
                  required={mailingPostalCodeRequired}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('apply-adult:contact-information.home-address.header')}</legend>
            <div className="space-y-6">
              <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" value="copy" checked={copyAddressChecked} onChange={checkHandler}>
                {t('apply-adult:contact-information.home-address.use-mailing-address')}
              </InputCheckbox>
              {!copyAddressChecked && (
                <>
                  <InputField
                    id="home-address"
                    name="homeAddress"
                    className="w-full"
                    label={t('apply-adult:contact-information.address-field.address')}
                    helpMessagePrimary={t('apply-adult:contact-information.address-field.address-note')}
                    helpMessagePrimaryClassName="text-black"
                    maxLength={30}
                    autoComplete="address-line1"
                    defaultValue={defaultState?.homeAddress ?? ''}
                    errorMessage={errorMessages['home-address']}
                    required
                  />
                  <InputField
                    id="home-apartment"
                    name="homeApartment"
                    className="w-full"
                    label={t('apply-adult:contact-information.address-field.apartment')}
                    maxLength={30}
                    autoComplete="address-line2"
                    defaultValue={defaultState?.homeApartment ?? ''}
                    errorMessage={errorMessages['home-apartment']}
                  />
                  <InputSelect
                    id="home-country"
                    name="homeCountry"
                    className="w-full sm:w-1/2"
                    label={t('apply-adult:contact-information.address-field.country')}
                    autoComplete="country"
                    defaultValue={defaultState?.homeCountry ?? ''}
                    errorMessage={errorMessages['home-country']}
                    options={[dummyOption, ...countries]}
                    onChange={homeCountryChangeHandler}
                    required
                  />
                  {homeRegions.length > 0 && (
                    <InputSelect
                      id="home-province"
                      name="homeProvince"
                      className="w-full sm:w-1/2"
                      label={t('apply-adult:contact-information.address-field.province')}
                      defaultValue={defaultState?.homeProvince ?? ''}
                      errorMessage={errorMessages['home-province']}
                      options={[dummyOption, ...homeRegions]}
                      required
                    />
                  )}
                  <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
                    <InputField
                      id="home-city"
                      name="homeCity"
                      className="w-full"
                      label={t('apply-adult:contact-information.address-field.city')}
                      maxLength={100}
                      autoComplete="address-level2"
                      defaultValue={defaultState?.homeCity ?? ''}
                      errorMessage={errorMessages['home-city']}
                      required
                    />
                    <InputField
                      id="home-postal-code"
                      name="homePostalCode"
                      className="w-full"
                      label={homePostalCodeRequired ? t('apply-adult:contact-information.address-field.postal-code') : t('apply-adult:contact-information.address-field.postal-code-optional')}
                      maxLength={100}
                      autoComplete="postal-code"
                      defaultValue={defaultState?.homePostalCode ?? ''}
                      errorMessage={errorMessages['home-postal-code']}
                      required={homePostalCodeRequired}
                    />
                  </div>
                </>
              )}
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Contact information click">
                {t('apply-adult:contact-information.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/adult/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Contact information click">
                {t('apply-adult:contact-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Contact information click">
                {t('apply-adult:contact-information.continue')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink
                id="back-button"
                routeId={[MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED].includes(Number(maritalStatus)) ? '$lang/_public/apply/$id/adult/partner-information' : '$lang/_public/apply/$id/adult/applicant-information'}
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Contact information click"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult:contact-information.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

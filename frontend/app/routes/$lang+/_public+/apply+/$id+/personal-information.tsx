import { useEffect, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type PersonalInformationState = {
  phoneNumber?: string;
  phoneNumberAlt?: string;
  mailingAddress: string;
  mailingApartment?: string;
  mailingCountry: string;
  mailingProvince?: string;
  mailingCity: string;
  mailingPostalCode?: string;
  copyMailingAddress?: string;
  homeAddress?: string;
  homeApartment?: string;
  homeCountry?: string;
  homeProvince?: string;
  homeCity?: string;
  homePostalCode?: string;
};

const validPostalCode = /^[ABCEGHJKLMNPRSTVXY]\d[A-Z]\d[A-Z]\d$/i;
const validZipCode = /^\d{5}$/;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.personalInformation,
  pageTitleI18nKey: 'apply:personal-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:personal-information.page-title') }) };

  return json({ id, meta, state: state.personalInformation, maritalStatus: state.applicantInformation?.maritalStatus, countryList, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();
  const applyFlow = getApplyFlow();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { id } = await applyFlow.loadState({ request, params });

  const isEmpty = (value: string | undefined) => {
    if (!value) {
      return true;
    }
    return !value.trim();
  };

  const isValidPostalCode = (countryCode: string | undefined, postalCode: string | undefined) => {
    if (!countryCode || !postalCode) {
      // if either field is omitted, skip the check
      // check and render empty field error
      return true;
    }
    switch (countryCode) {
      case CANADA_COUNTRY_ID:
        return validPostalCode.test(postalCode);
      case USA_COUNTRY_ID:
        return validZipCode.test(postalCode);
      default:
        return true;
    }
  };

  const personalInformationFormSchema: z.ZodType<PersonalInformationState> = z
    .object({
      phoneNumber: z
        .string()
        .refine((val) => !val || (val && isValidPhoneNumber(val, 'CA')), { message: t('apply:personal-information.error-message.invalid-phone') })
        .optional(),
      phoneNumberAlt: z
        .string()
        .refine((val) => !val || (val && isValidPhoneNumber(val, 'CA')), { message: t('apply:personal-information.error-message.invalid-phone') })
        .optional(),
      mailingAddress: z
        .string()
        .min(1, { message: t('apply:personal-information.error-message.empty-address') })
        .transform((val) => val.trim()),
      mailingApartment: z.string().trim().optional(),
      mailingCountry: z
        .string()
        .min(1, { message: t('apply:personal-information.error-message.empty-country') })
        .transform((val) => val.trim()),
      mailingProvince: z
        .string()
        .min(1, { message: t('apply:personal-information.error-message.empty-province') })
        .optional(),
      mailingCity: z
        .string()
        .min(1, { message: t('apply:personal-information.error-message.empty-city') })
        .transform((val) => val.trim()),
      mailingPostalCode: z
        .string()
        .trim()
        .optional()
        .transform((val) => val?.replace(/\s/g, '')),
      copyMailingAddress: z.string().optional(),
      homeAddress: z.string().optional(),
      homeApartment: z.string().optional(),
      homeCountry: z.string().optional(),
      homeProvince: z.string().optional(),
      homeCity: z.string().optional(),
      homePostalCode: z
        .string()
        .optional()
        .transform((val) => val?.replace(/\s/g, '')),
    })
    .superRefine((val, ctx) => {
      if (!isEmpty(val.mailingCountry)) {
        if ((val.mailingCountry === CANADA_COUNTRY_ID || val.mailingCountry === USA_COUNTRY_ID) && isEmpty(val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.empty-postal-code'), path: ['mailingPostalCode'] });
        }

        if (!isValidPostalCode(val.mailingCountry, val.mailingPostalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: val.mailingCountry === CANADA_COUNTRY_ID ? t('apply:personal-information.error-message.invalid-postal-code') : t('apply:personal-information.error-message.invalid-zip-code'),
            path: ['mailingPostalCode'],
          });
        }
      }

      if (val.copyMailingAddress !== 'on') {
        const homeAddessFields: { fieldName: keyof typeof val; errorMessage: string }[] = [
          { fieldName: 'homeAddress', errorMessage: t('apply:personal-information.error-message.empty-address') },
          { fieldName: 'homeCountry', errorMessage: t('apply:personal-information.error-message.empty-country') },
          { fieldName: 'homeCity', errorMessage: t('apply:personal-information.error-message.empty-city') },
        ];
        homeAddessFields.forEach(({ fieldName, errorMessage }) => {
          if (isEmpty(val[fieldName])) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage, path: [fieldName] });
          }
        });

        if (!isEmpty(val.homeCountry)) {
          if ((val.homeCountry === CANADA_COUNTRY_ID || val.homeCountry === USA_COUNTRY_ID) && isEmpty(val.homeProvince)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.empty-province'), path: ['homeProvince'] });
          }
          if ((val.homeCountry === CANADA_COUNTRY_ID || val.homeCountry === USA_COUNTRY_ID) && isEmpty(val.homePostalCode)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.empty-postal-code'), path: ['homePostalCode'] });
          }
        }

        if (!isValidPostalCode(val.homeCountry, val.homePostalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: val.homeCountry === CANADA_COUNTRY_ID ? t('apply:personal-information.error-message.invalid-postal-code') : t('apply:personal-information.error-message.invalid-zip-code'),
            path: ['homePostalCode'],
          });
        }
      }
    });

  const formData = await request.formData();
  const personalInformation = {
    phoneNumber: String(formData.get('phoneNumber') ?? ''),
    phoneNumberAlt: String(formData.get('phoneNumberAlt') ?? ''),
    mailingAddress: String(formData.get('mailingAddress') ?? ''),
    mailingApartment: String(formData.get('mailingApartment') ?? ''),
    mailingCountry: String(formData.get('mailingCountry') ?? ''),
    mailingProvince: String(formData.get('mailingProvince') ?? ''),
    mailingCity: String(formData.get('mailingCity') ?? ''),
    mailingPostalCode: String(formData.get('mailingPostalCode') ?? ''),
    copyMailingAddress: String(formData.get('copyMailingAddress') ?? ''),
    homeAddress: String(formData.get('homeAddress') ?? ''),
    homeApartment: String(formData.get('homeApartment') ?? ''),
    homeCountry: String(formData.get('homeCountry') ?? ''),
    homeProvince: String(formData.get('homeProvince') ?? ''),
    homeCity: String(formData.get('homeCity') ?? ''),
    homePostalCode: String(formData.get('homePostalCode') ?? ''),
  };

  const parsedDataResult = personalInformationFormSchema.safeParse(personalInformation);
  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: personalInformation,
    });
  }

  const updatedData =
    parsedDataResult.data.copyMailingAddress === 'on'
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

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { personalInformation: updatedData },
  });

  return redirectWithLocale(request, `/apply/${id}/communication-preference`, sessionResponseInit);
}

export default function ApplyFlowPersonalInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, state, countryList, maritalStatus, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(state?.mailingCountry);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<typeof regionList>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(state?.copyMailingAddress === 'on');
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(state?.homeCountry);
  const [homeCountryRegions, setHomeCountryRegions] = useState<typeof regionList>([]);
  const errorSummaryId = 'error-summary';

  const errorMessages = {
    phoneNumber: fetcher.data?.errors.phoneNumber?._errors[0],
    phoneNumberAlt: fetcher.data?.errors.phoneNumberAlt?._errors[0],
    mailingAddress: fetcher.data?.errors.mailingAddress?._errors[0],
    mailingApartment: fetcher.data?.errors.mailingApartment?._errors[0],
    mailingProvince: fetcher.data?.errors.mailingProvince?._errors[0],
    mailingCountry: fetcher.data?.errors.mailingCountry?._errors[0],
    mailingCity: fetcher.data?.errors.mailingCity?._errors[0],
    mailingPostalCode: fetcher.data?.errors.mailingPostalCode?._errors[0],
    copyMailingAddress: fetcher.data?.errors.copyMailingAddress?._errors[0],
    homeAddress: fetcher.data?.errors.homeAddress?._errors[0],
    homeApartment: fetcher.data?.errors.homeApartment?._errors[0],
    homeProvince: fetcher.data?.errors.homeProvince?._errors[0],
    homeCountry: fetcher.data?.errors.homeCountry?._errors[0],
    homeCity: fetcher.data?.errors.homeCity?._errors[0],
    homePostalCode: fetcher.data?.errors.homePostalCode?._errors[0],
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (fetcher.data?.formData && fetcher.data.errors._errors.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

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
    .map((country) => {
      return {
        children: i18n.language === 'fr' ? country.nameFr : country.nameEn,
        value: country.countryId,
      };
    })
    .sort((country1, country2) => country1.children.localeCompare(country2.children));

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions: InputOptionProps[] = mailingCountryRegions
    .map((region) => {
      return {
        children: i18n.language === 'fr' ? region.nameFr : region.nameEn,
        value: region.provinceTerritoryStateId,
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
    .map((region) => {
      return {
        children: i18n.language === 'fr' ? region.nameFr : region.nameEn,
        value: region.provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

  const dummyOption: InputOptionProps = { children: t('apply:personal-information.address-field.select-one'), value: '' };

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={60} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p id="form-instructions" className="mb-6">
          {t('apply:personal-information.form-instructions')}
        </p>
        <fetcher.Form method="post" noValidate>
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <InputField id="phone-number" name="phoneNumber" className="w-full" label={t('apply:personal-information.telephone-number')} defaultValue={state?.phoneNumber} errorMessage={errorMessages.phoneNumber} />
            <InputField id="phone-number-alt" name="phoneNumberAlt" className="w-full" label={t('apply:personal-information.telephone-number-alt')} defaultValue={state?.phoneNumberAlt} errorMessage={errorMessages.phoneNumberAlt} />
          </div>
          <h2 className="mb-4 font-lato text-2xl font-bold">{t('apply:personal-information.mailing-address.header')}</h2>
          <div className="my-6 space-y-6">
            <InputField
              id="mailingAddress"
              name="mailingAddress"
              className="w-full"
              label={t('apply:personal-information.address-field.address')}
              helpMessagePrimary={t('apply:personal-information.address-field.address-note')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={state?.mailingAddress}
              errorMessage={errorMessages.mailingAddress}
              required
            />
            <InputField id="mailingApartment" name="mailingApartment" className="w-full" label={t('apply:personal-information.address-field.apartment')} defaultValue={state?.mailingApartment} errorMessage={errorMessages.mailingApartment} />
            <InputSelect
              id="mailingCountry"
              name="mailingCountry"
              className="w-full sm:w-1/2"
              label={t('apply:personal-information.address-field.country')}
              defaultValue={state?.mailingCountry}
              errorMessage={errorMessages.mailingCountry}
              required
              options={[dummyOption, ...countries]}
              onChange={mailingCountryChangeHandler}
            />
            {mailingRegions.length > 0 && (
              <InputSelect
                id="mailingProvince"
                name="mailingProvince"
                className="w-full sm:w-1/2"
                label={t('apply:personal-information.address-field.province')}
                defaultValue={state?.mailingProvince}
                errorMessage={errorMessages.mailingProvince}
                required
                options={[dummyOption, ...mailingRegions]}
              />
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="mailingCity" name="mailingCity" className="w-full" label={t('apply:personal-information.address-field.city')} defaultValue={state?.mailingCity} errorMessage={errorMessages.mailingCity} required />
              <InputField
                id="mailingPostalCode"
                name="mailingPostalCode"
                className="w-full"
                label={t('apply:personal-information.address-field.postal-code')}
                defaultValue={state?.mailingPostalCode}
                errorMessage={errorMessages.mailingPostalCode}
                required={selectedMailingCountry === CANADA_COUNTRY_ID || selectedMailingCountry === USA_COUNTRY_ID}
              />
            </div>
          </div>

          <h2 className="mb-6 font-lato text-2xl font-bold">{t('apply:personal-information.home-address.header')}</h2>
          <div className="mb-8 space-y-6">
            <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" checked={copyAddressChecked} onChange={checkHandler}>
              {t('apply:personal-information.home-address.use-mailing-address')}
            </InputCheckbox>
            {!copyAddressChecked && (
              <>
                <InputField
                  id="homeAddress"
                  name="homeAddress"
                  className="w-full"
                  label={t('apply:personal-information.address-field.address')}
                  helpMessagePrimary={t('apply:personal-information.address-field.address-note')}
                  helpMessagePrimaryClassName="text-black"
                  defaultValue={state?.homeAddress}
                  errorMessage={errorMessages.homeAddress}
                  required
                />
                <InputField id="homeApartment" name="homeApartment" className="w-full" label={t('apply:personal-information.address-field.apartment')} defaultValue={state?.homeApartment} errorMessage={errorMessages.homeApartment} />
                <InputSelect
                  id="homeCountry"
                  name="homeCountry"
                  className="w-full sm:w-1/2"
                  label={t('apply:personal-information.address-field.country')}
                  defaultValue={state?.homeCountry}
                  errorMessage={errorMessages.homeCountry}
                  required
                  options={[dummyOption, ...countries]}
                  onChange={homeCountryChangeHandler}
                />
                {homeRegions.length > 0 && (
                  <InputSelect
                    id="homeProvince"
                    name="homeProvince"
                    className="w-full sm:w-1/2"
                    label={t('apply:personal-information.address-field.province')}
                    defaultValue={state?.homeProvince}
                    errorMessage={errorMessages.homeProvince}
                    required
                    options={[dummyOption, ...homeRegions]}
                  />
                )}
                <div className="mb-6 grid gap-6 md:grid-cols-2">
                  <InputField id="homeCity" name="homeCity" className="w-full" label={t('apply:personal-information.address-field.city')} defaultValue={state?.homeCity} errorMessage={errorMessages.homeCity} required />
                  <InputField
                    id="homePostalCode"
                    name="homePostalCode"
                    className="w-full"
                    label={t('apply:personal-information.address-field.postal-code')}
                    defaultValue={state?.homePostalCode}
                    errorMessage={errorMessages.homePostalCode}
                    required={selectedHomeCountry === CANADA_COUNTRY_ID || selectedHomeCountry === USA_COUNTRY_ID}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={['MARRIED', 'COMMONLAW'].includes(maritalStatus ?? '') ? `/apply/${id}/partner-information` : `/apply/${id}/applicant-information`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:personal-information.back')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('apply:personal-information.continue')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

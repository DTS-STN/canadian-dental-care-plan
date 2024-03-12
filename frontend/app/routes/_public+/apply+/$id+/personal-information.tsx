import { useEffect, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, MetaFunction, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { RegionInfo, getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';

const validPostalCode = new RegExp('^[ABCEGHJKLMNPRSTVXYabceghjklmnprstvxy]\\d[A-Za-z] \\d[A-Za-z]\\d{1}$');
const validZipCode = new RegExp('^\\d{5}$');

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:personal-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('apply:personal-information.page-title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const { COUNTRY_CODE_CANADA, COUNTRY_CODE_USA } = getEnv();

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  return json({ id, state: state.personalInformation, maritalStatus: state.applicantInformation?.maritalStatus, countryList, regionList, COUNTRY_CODE_CANADA, COUNTRY_CODE_USA });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { COUNTRY_CODE_CANADA, COUNTRY_CODE_USA } = getEnv();
  const applyFlow = getApplyFlow();
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
      case COUNTRY_CODE_CANADA:
        return validPostalCode.test(postalCode);
      case COUNTRY_CODE_USA:
        return validZipCode.test(postalCode);
      default:
        return true;
    }
  };

  const personalInformationFormSchema = z
    .object({
      phoneNumber: z
        .string()
        .refine((val) => !val || (val && isValidPhoneNumber(val, 'CA')), { message: 'invalid-phone' })
        .optional(),
      phoneNumberAlt: z
        .string()
        .refine((val) => !val || (val && isValidPhoneNumber(val, 'CA')), { message: 'invalid-phone' })
        .optional(),
      mailingAddress: z
        .string()
        .min(1, { message: 'empty-address' })
        .transform((val) => val.trim()),
      mailingApartment: z.string().trim().optional(),
      mailingCountry: z
        .string()
        .min(1, { message: 'empty-country' })
        .transform((val) => val.trim()),
      mailingProvince: z.string().min(1, { message: 'empty-province' }).optional(),
      mailingCity: z
        .string()
        .min(1, { message: 'empty-city' })
        .transform((val) => val.trim()),
      mailingPostalCode: z.string().trim().optional(),
      copyMailingAddress: z.string().optional(),
      homeAddress: z.string().optional(),
      homeApartment: z.string().optional(),
      homeCountry: z.string().optional(),
      homeProvince: z.string().optional(),
      homeCity: z.string().optional(),
      homePostalCode: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (!isEmpty(val.mailingCountry)) {
        if ((val.mailingCountry === COUNTRY_CODE_CANADA || val.mailingCountry === COUNTRY_CODE_USA) && isEmpty(val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty-postal-code', path: ['mailingPostalCode'] });
        }

        if (!isValidPostalCode(val.mailingCountry, val.mailingPostalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: val.mailingCountry === COUNTRY_CODE_CANADA ? 'invalid-postal-code' : 'invalid-zip-code',
            path: ['mailingPostalCode'],
          });
        }
      }

      if (val.copyMailingAddress !== 'on') {
        const homeAddessFields: { fieldName: keyof typeof val; errorMessage: string }[] = [
          { fieldName: 'homeAddress', errorMessage: 'empty-address' },
          { fieldName: 'homeCountry', errorMessage: 'empty-country' },
          { fieldName: 'homeCity', errorMessage: 'empty-city' },
        ];
        homeAddessFields.forEach(({ fieldName, errorMessage }) => {
          if (isEmpty(val[fieldName])) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage, path: [fieldName] });
          }
        });

        if (!isEmpty(val.homeCountry)) {
          if ((val.homeCountry === COUNTRY_CODE_CANADA || val.homeCountry === COUNTRY_CODE_USA) && isEmpty(val.homeProvince)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty-province', path: ['homeProvince'] });
          }
          if ((val.homeCountry === COUNTRY_CODE_CANADA || val.homeCountry === COUNTRY_CODE_USA) && isEmpty(val.homePostalCode)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty-postal-code', path: ['homePostalCode'] });
          }
        }

        if (!isValidPostalCode(val.homeCountry, val.homePostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: val.homeCountry === COUNTRY_CODE_CANADA ? 'invalid-postal-code' : 'invalid-zip-code', path: ['homePostalCode'] });
        }
      }
    });

  const formData = Object.fromEntries(await request.formData());

  const parsedDataResult = personalInformationFormSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof personalInformationFormSchema>>,
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

  return redirect(`/apply/${id}/communication-preference`, sessionResponseInit);
}

export default function ApplyFlowPersonalInformation() {
  const { id, state, countryList, maritalStatus, regionList, COUNTRY_CODE_CANADA, COUNTRY_CODE_USA } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [selectedMailingCountry, setSelectedMailingCountry] = useState(state?.mailingCountry);
  const [mailingCountryRegions, setMailingCountryRegions] = useState<RegionInfo[]>([]);
  const [copyAddressChecked, setCopyAddressChecked] = useState(state?.copyMailingAddress === 'on');
  const [selectedHomeCountry, setSelectedHomeCountry] = useState(state?.homeCountry);
  const [homeCountryRegions, setHomeCountryRegions] = useState<RegionInfo[]>([]);

  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:personal-information.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    phoneNumber: getErrorMessage(actionData?.errors.phoneNumber?._errors[0]),
    phoneNumberAlt: getErrorMessage(actionData?.errors.phoneNumberAlt?._errors[0]),
    mailingAddress: getErrorMessage(actionData?.errors.mailingAddress?._errors[0]),
    mailingApartment: getErrorMessage(actionData?.errors.mailingApartment?._errors[0]),
    mailingProvince: getErrorMessage(actionData?.errors.mailingProvince?._errors[0]),
    mailingCountry: getErrorMessage(actionData?.errors.mailingCountry?._errors[0]),
    mailingCity: getErrorMessage(actionData?.errors.mailingCity?._errors[0]),
    mailingPostalCode: getErrorMessage(actionData?.errors.mailingPostalCode?._errors[0]),
    copyMailingAddress: getErrorMessage(actionData?.errors.copyMailingAddress?._errors[0]),
    homeAddress: getErrorMessage(actionData?.errors.homeAddress?._errors[0]),
    homeApartment: getErrorMessage(actionData?.errors.homeApartment?._errors[0]),
    homeProvince: getErrorMessage(actionData?.errors.homeProvince?._errors[0]),
    homeCountry: getErrorMessage(actionData?.errors.homeCountry?._errors[0]),
    homeCity: getErrorMessage(actionData?.errors.homeCity?._errors[0]),
    homePostalCode: getErrorMessage(actionData?.errors.homePostalCode?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

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
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p id="form-instructions" className="mb-6">
        {t('apply:personal-information.form-instructions')}
      </p>
      <Form method="post" noValidate>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <InputField id="phone-number" name="phoneNumber" className="w-full" label={t('apply:personal-information.telephone-number')} defaultValue={state?.phoneNumber} errorMessage={errorMessages.phoneNumber} />
          <InputField id="phone-number-alt" name="phoneNumberAlt" className="w-full" label={t('apply:personal-information.telephone-number-alt')} defaultValue={state?.phoneNumberAlt} errorMessage={errorMessages.phoneNumberAlt} />
        </div>
        <div className="mb-6">
          <p className="text-2xl font-semibold"> {t('apply:personal-information.mailing-address.header')}</p>
          <p className="mb-4"> {t('apply:personal-information.mailing-address.note')}</p>
          <div className="max-w-prose space-y-6">
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
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <InputField id="mailingCity" name="mailingCity" label={t('apply:personal-information.address-field.city')} defaultValue={state?.mailingCity} errorMessage={errorMessages.mailingCity} required />
              <InputField
                id="mailingPostalCode"
                name="mailingPostalCode"
                label={t('apply:personal-information.address-field.postal-code')}
                defaultValue={state?.mailingPostalCode}
                errorMessage={errorMessages.mailingPostalCode}
                required={selectedMailingCountry === COUNTRY_CODE_CANADA || selectedMailingCountry === COUNTRY_CODE_USA}
              />
            </div>
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold"> {t('apply:personal-information.home-address.header')}</p>
          <InputCheckbox
            id="copyMailingAddress"
            name="copyMailingAddress"
            className="my-6"
            checked={copyAddressChecked}
            onChange={checkHandler}
            append={
              !copyAddressChecked && (
                <div className="max-w-prose space-y-6">
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
                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <InputField id="homeCity" name="homeCity" label={t('apply:personal-information.address-field.city')} defaultValue={state?.homeCity} errorMessage={errorMessages.homeCity} required />
                    <InputField
                      id="homePostalCode"
                      name="homePostalCode"
                      label={t('apply:personal-information.address-field.postal-code')}
                      defaultValue={state?.homePostalCode}
                      errorMessage={errorMessages.homePostalCode}
                      required={selectedHomeCountry === COUNTRY_CODE_CANADA || selectedHomeCountry === COUNTRY_CODE_USA}
                    />
                  </div>
                </div>
              )
            }
          >
            {t('apply:personal-information.home-address.use-mailing-address')}
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={['MARRIED', 'COMMONLAW'].includes(maritalStatus ?? '') ? `/apply/${id}/partner-information` : `/apply/${id}/applicant-information`}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:personal-information.back')}
          </ButtonLink>
          <Button variant="primary" id="continue-button">
            {t('apply:personal-information.continue')}
            <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}

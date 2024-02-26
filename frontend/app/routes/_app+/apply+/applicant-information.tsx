import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import type { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import type { RegionInfo } from '~/services/lookup-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('intake-forms');
export const handle = {
  breadcrumbs: [{ labelI18nKey: 'intake-forms:applicant-information.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-1133',
  pageTitleI18nKey: 'intake-forms:applicant-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  raoidcService.handleSessionValidation(request);
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();
  return json({ countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);
  const applicantInformationFormSchema = z.object({
    year: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    month: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    day: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    address: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    city: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    province: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
  });
  const formData = Object.fromEntries(await request.formData());

  const dateOfBirth = formData['year'] + '-' + formData['month'] + '-' + formData['day']; //2024-11-14
  const dateSchema = z.coerce.date();
  const dateParsedResult = dateSchema.safeParse(dateOfBirth);

  if (!dateParsedResult.success) {
    return json({
      errors: 'invalid-date',
      formData: formData as Partial<z.infer<typeof applicantInformationFormSchema>>,
    });
  }
  //TODO
  //COMPLETE ONCE THE NEXT PAGE IS ADDED

  const parsedDataResult = await applicantInformationFormSchema.safeParseAsync(formData);
  if (!parsedDataResult.success) {
    return json({
      errors: 'invalid-date',
      formData: formData as Partial<z.infer<typeof applicantInformationFormSchema>>,
    });
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  session.set('pageA4-DoB', dateOfBirth);
  session.set('applicant-information-form', parsedDataResult.data);
  return redirect('/apply/applicant-information', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}
export default function EnterApplicantInformation() {
  const actionData = useActionData<typeof action>();
  const { countryList, regionList } = useLoaderData<typeof loader>();
  const [countryRegions, setCountryRegions] = useState<RegionInfo[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const errorSummaryId = 'error-summary';
  const { i18n, t } = useTranslation(i18nNamespaces);

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.countryId === selectedCountry);
    setCountryRegions(filteredRegions);
  }, [selectedCountry, regionList]);

  const countryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.currentTarget.value);
  };
  const defaultValues = {
    province: '',
    country: '',
  };
  const countries: InputOptionProps[] = countryList.map((country) => {
    return {
      label: i18n.language === 'fr' ? country.nameFrench : country.nameEnglish,
      value: country.countryId,
      id: country.countryId,
    };
  }) as InputOptionProps[];

  //populate region/province/state list with selected country or current address country
  const regions: InputOptionProps[] = (selectedCountry ? countryRegions : regionList.filter((region) => region.countryId === defaultValues.country))
    .map((region) => {
      return {
        label: i18n.language === 'fr' ? region.nameFrench : region.nameEnglish,
        value: region.provinceTerritoryStateId,
        id: region.provinceTerritoryStateId,
      };
    })
    .sort((r1, r2) => r1.label.localeCompare(r2.label)) as InputOptionProps[];
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
    return t(`intake-forms:applicant-information.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    dateOfBirthFieldSet: getErrorMessage(actionData?.errors),
    //address: getErrorMessage(actionData?.errors.fieldErrors.address?.[0]),
    //city: getErrorMessage(actionData?.errors.fieldErrors.city?.[0]),
    //province: getErrorMessage(actionData?.errors.fieldErrors.province?.[0]),
    //postalCode: getErrorMessage(actionData?.errors.fieldErrors.postalCode?.[0]),
    //country: getErrorMessage(actionData?.errors.fieldErrors.country?.[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);
  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post">
        <InputField id="sinNumber" label={t('intake-forms:applicant-information.social-insurance-number')} placeholder="xxx-xxx-xxx" name="social-insurance-number" required maxLength={11} />

        <fieldset id="dateOfBirthFieldSet">
          <legend>{t('intake-forms:applicant-information.date-of-birth')}</legend>
          <InputField id="year" label={t('intake-forms:applicant-information.field.year')} placeholder="YYYY" name="year" required maxLength={4} />
          <InputField id="month" label={t('intake-forms:applicant-information.field.month')} placeholder="MM" name="month" required maxLength={2} />
          <InputField id="day" label={t('intake-forms:applicant-information.field.day')} placeholder="DD" name="day" required maxLength={2} />
        </fieldset>
        <div>
          <InputField id="lastName" label={t('intake-forms:applicant-information.last-name')} name="lastName" required />
          <InputField id="firstName" label={t('intake-forms:applicant-information.first-name')} name="firstName" />
        </div>
        <div>
          <InputRadios
            id="selected-marital-status"
            name="selected-marital-status"
            legend={t('intake-forms:applicant-information.marital-status.radio-buttons-title')}
            options={[
              { value: 'married-or-commonlaw', children: t('intake-forms:applicant-information.marital-status.married-or-commonlaw') },
              { value: 'single', children: t('intake-forms:applicant-information.marital-status.single') },
              { value: 'widowed', children: t('intake-forms:applicant-information.marital-status.widowed') },
              { value: 'divorced', children: t('intake-forms:applicant-information.marital-status.divorced') },
              { value: 'seperated', children: t('intake-forms:applicant-information.marital-status.seperated') },
            ]}
            required
          />
        </div>

        <fieldset>
          <legend>{t('intake-forms:applicant-information.contact-information')}</legend>
          <InputField id="telephone-number" label={t('intake-forms:applicant-information.telephone')} name="telephone-number" />
          <InputField id="alternate-telephone" label={t('intake-forms:applicant-information.alternative-telephone')} name="alternate-telephone" />
        </fieldset>

        <p>{t('intake-forms:applicant-information.home-address')}</p>
        <InputField id="address" label={t('intake-forms:applicant-information.address')} name="address" required />
        <InputField id="city" label={t('intake-forms:applicant-information.city-town')} name="city-town" required />
        <InputField id="postalCode" label={t('intake-forms:applicant-information.postal-code-zip-code')} name="postalCode" required />
        <InputSelect
          id="country"
          className="w-full sm:w-1/2"
          label={t('intake-forms:applicant-information.country')}
          name="country"
          required
          options={countries}
          onChange={countryChangeHandler}
          defaultValue={defaultValues.country}
          //errorMessage={errorMessages.country}
        />
        <InputSelect
          id="province"
          className="w-full sm:w-1/2"
          label={t('intake-forms:applicant-information.province-territory-state-region')}
          name="province"
          options={regions}
          defaultValue={defaultValues.province}
          required
          //errorMessage={errorMessages.province}
        />
        <div>
          <ButtonLink id="back-button" to="/apply/application-type">
            {t('intake-forms:applicant-information.button-back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary">
            {t('intake-forms:applicant-information.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}

import { useEffect, useState } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { type InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { getAddressService } from '~/services/address-service.server';
import { type RegionInfo } from '~/services/lookup-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getWSAddressService } from '~/services/wsaddress-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information', 'gcweb');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.home-address-change' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:home-address.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const addressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ addressInfo, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const formDataSchema = z.object({
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
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }
  const wsAddressWebService = await getWSAddressService();
  const validateResultAddress = await wsAddressWebService.validateWSAddress({
    addressLine: parsedDataResult.data.address,
    city: parsedDataResult.data.city,
    country: parsedDataResult.data.country,
    language: 'EN',
    postalCode: parsedDataResult.data.postalCode ?? '',
    province: parsedDataResult.data.province ?? '',
    geographicScope: 'GS',
    parseType: 'PT',
  });

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  session.set('newHomeAddress', parsedDataResult.data);
  const redirectUrl = validateResultAddress.statusCode === 'Invalid' ? '/personal-information/home-address/address-accuracy' : '/personal-information/home-address/confirm';

  return redirect(redirectUrl, {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PersonalInformationHomeAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, countryList, regionList } = useLoaderData<typeof loader>();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryRegions, setCountryRegions] = useState<RegionInfo[]>([]);
  const { i18n, t } = useTranslation(i18nNamespaces);
  const errorSummaryId = 'error-summary';

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.country.code === selectedCountry);
    setCountryRegions(filteredRegions);
  }, [selectedCountry, regionList]);

  const countryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.currentTarget.value);
  };

  const defaultValues = {
    address: actionData?.formData.address ?? addressInfo?.address,
    city: actionData?.formData.city ?? addressInfo?.city,
    province: actionData?.formData.province ?? addressInfo?.province ?? '',
    country: actionData?.formData.country ?? addressInfo?.country ?? '',
    postalCode: actionData?.formData.postalCode ?? addressInfo?.postalCode ?? '',
  };

  const countries: InputOptionProps[] = countryList.map((country) => {
    return {
      label: i18n.language === 'fr' ? country.nameFr : country.nameEn,
      value: country.code,
      id: country.code,
    };
  }) as InputOptionProps[];

  //populate region/province/state list with selected country or current address country
  const regions: InputOptionProps[] = (selectedCountry ? countryRegions : regionList.filter((region) => region.country.code === defaultValues.country))
    .map((region) => {
      return {
        label: i18n.language === 'fr' ? region.nameFr : region.nameEn,
        value: region.code,
        id: region.code,
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
    return t(`personal-information:home-address.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    address: getErrorMessage(actionData?.errors.fieldErrors.address?.[0]),
    city: getErrorMessage(actionData?.errors.fieldErrors.city?.[0]),
    province: getErrorMessage(actionData?.errors.fieldErrors.province?.[0]),
    postalCode: getErrorMessage(actionData?.errors.fieldErrors.postalCode?.[0]),
    country: getErrorMessage(actionData?.errors.fieldErrors.country?.[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:home-address.edit.subtitle')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form className="max-w-prose" method="post">
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          <InputField id="address" className="w-full" label={t('personal-information:home-address.edit.field.address')} name="address" required defaultValue={defaultValues.address} errorMessage={errorMessages.address} />
          <InputField id="city" className="w-full" label={t('personal-information:home-address.edit.field.city')} name="city" required defaultValue={defaultValues.city} errorMessage={errorMessages.city} />
          {regions.length > 0 && (
            <InputSelect id="province" className="w-full sm:w-1/2" label={t('personal-information:home-address.edit.field.province')} name="province" defaultValue={defaultValues.province} options={regions} errorMessage={errorMessages.province} />
          )}
          <InputField id="postalCode" label={t('personal-information:home-address.edit.field.postal-code')} name="postalCode" defaultValue={defaultValues.postalCode} errorMessage={errorMessages.postalCode} />
          <InputSelect
            id="country"
            className="w-full sm:w-1/2"
            label={t('personal-information:home-address.edit.field.country')}
            name="country"
            defaultValue={defaultValues.country}
            required
            options={countries}
            onChange={countryChangeHandler}
            errorMessage={errorMessages.country}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="change-button" variant="primary">
            {t('personal-information:home-address.edit.button.change')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information">
            {t('personal-information:home-address.edit.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}

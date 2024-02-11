import { useEffect, useState } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Address } from '~/components/address';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { type InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { getAddressService } from '~/services/address-service.server';
import { type RegionInfo } from '~/services/lookup-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.mailing-address-change' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:mailing-address.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const addressInfo = await getAddressService().getAddressInfo(userId, userInfo.mailingAddress ?? '');
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo.homeAddress ?? '');

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  return json({ addressInfo, homeAddressInfo, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const copyHomeAddressSchema = z.object({
    copyHomeAddress: z.string().transform((value) => value === 'on'),
  });
  const addressFormSchema = z.object({
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
  const formDataSchema = z.union([copyHomeAddressSchema, addressFormSchema]);

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof addressFormSchema>>,
    });
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const { copyHomeAddress } = formData as Partial<z.infer<typeof copyHomeAddressSchema>>;
  if (copyHomeAddress) {
    const userService = getUserService();
    const userId = await userService.getUserId();
    const userInfo = await userService.getUserInfo(userId);
    if (!userInfo) {
      throw new Response(null, { status: 404 });
    }

    const homeAddress = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
    session.set('newMailingAddress', homeAddress);
  } else {
    session.set('newMailingAddress', parsedDataResult.data);
  }

  return redirect('/personal-information/mailing-address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PersonalInformationMailingAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, homeAddressInfo, countryList, regionList } = useLoaderData<typeof loader>();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryRegions, setCountryRegions] = useState<RegionInfo[]>([]);
  const { i18n, t } = useTranslation(i18nNamespaces);
  const errorSummaryId = 'error-summary';
  const [isCopyAddressChecked, setCopyAddressChecked] = useState(false);

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.country.code === selectedCountry);
    setCountryRegions(filteredRegions);
  }, [selectedCountry, regionList]);

  const countryChangeHandler = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.currentTarget.value);
  };

  const checkHandler = () => {
    setCopyAddressChecked((curState) => !curState);
  };

  const defaultValues = {
    address: actionData?.formData.address ?? addressInfo?.address,
    city: actionData?.formData.city ?? addressInfo?.city,
    province: actionData?.formData.province ?? addressInfo?.province,
    country: actionData?.formData.country ?? addressInfo?.country,
    postalCode: actionData?.formData.postalCode ?? addressInfo?.postalCode,
  };

  const countries: InputOptionProps[] = countryList.map((country) => {
    return {
      label: i18n.language === 'fr' ? country.nameFr : country.nameEn,
      value: country.code,
      id: country.code,
    };
  }) as InputOptionProps[];

  const regions: InputOptionProps[] = selectedCountry
    ? (countryRegions
        .map((region) => {
          return {
            label: i18n.language === 'fr' ? region.nameFr : region.nameEn,
            value: region.code,
            id: region.code,
          };
        })
        .sort((r1, r2) => (r1.id < r2.id ? -1 : 1)) as InputOptionProps[])
    : (regionList
        .filter((region) => region.country.code === defaultValues.country)
        .map((region) => {
          return {
            label: i18n.language === 'fr' ? region.nameFr : region.nameEn,
            value: region.code,
            id: region.code,
          };
        })
        .sort((r1, r2) => (r1.id < r2.id ? -1 : 1)) as InputOptionProps[]);

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
    return t(`personal-information:mailing-address.edit.error-message.${errorI18nKey}` as any);
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
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form className="max-w-prose" method="post">
        {homeAddressInfo && (
          <div className="checkbox gc-chckbxrdio">
            <input id="copy-home-address" type="checkbox" name="copyHomeAddress" checked={isCopyAddressChecked} onChange={checkHandler} />
            <label id="copy-home-address" htmlFor="copy-home-address">
              {t('personal-information:mailing-address.edit.copy-home-address')}
            </label>
          </div>
        )}

        {isCopyAddressChecked && homeAddressInfo && (
          <div>
            <p>
              <strong>{t('personal-information:mailing-address.edit.copy-home-address-note')}</strong>
            </p>
            <Address
              address={homeAddressInfo.address}
              city={homeAddressInfo.city}
              provinceState={regionList.find((region) => region.code === homeAddressInfo.province)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn']}
              postalZipCode={homeAddressInfo.postalCode}
              country={countryList.find((country) => country.code === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
            />
          </div>
        )}

        {!isCopyAddressChecked && (
          <>
            <InputField id="address" label={t('personal-information:mailing-address.edit.field.address')} name="address" required defaultValue={defaultValues.address} errorMessage={errorMessages.address} />
            <InputField id="city" label={t('personal-information:mailing-address.edit.field.city')} name="city" required defaultValue={defaultValues.city} errorMessage={errorMessages.city} />
            {regions.length > 0 && <InputSelect id="province" label={t('personal-information:mailing-address.edit.field.province')} name="province" options={regions} defaultValue={defaultValues.province} errorMessage={errorMessages.province} />}
            <InputField id="postalCode" label={t('personal-information:mailing-address.edit.field.postal-code')} name="postalCode" defaultValue={defaultValues.postalCode} errorMessage={errorMessages.postalCode} />
            <InputSelect
              id="country"
              label={t('personal-information:mailing-address.edit.field.country')}
              name="country"
              required
              options={countries}
              onChange={countryChangeHandler}
              defaultValue={defaultValues.country}
              errorMessage={errorMessages.country}
            />
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <button id="change-button" className="btn btn-primary btn-lg">
            {t('personal-information:mailing-address.edit.button.change')}
          </button>
          <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:mailing-address.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}

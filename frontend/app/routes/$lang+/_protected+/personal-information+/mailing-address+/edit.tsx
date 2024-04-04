import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.mailing-address-change' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.mailingAddressEdit,
  pageTitleI18nKey: 'personal-information:mailing-address.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const csrfToken = String(session.get('csrfToken'));

  const addressInfo = await getAddressService().getAddressInfo(userId, userInfo.mailingAddress ?? '');

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.edit.page-title') }) };

  return json({ addressInfo, countryList, csrfToken, meta, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const log = getLogger('mailing-address/edit');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const copyHomeAddressSchema = z.object({
    copyHomeAddress: z.string().transform((value) => value === 'on'),
  });
  const addressFormSchema = z.object({
    address: z.string().trim().min(1, { message: 'empty-field' }),
    city: z.string().trim().min(1, { message: 'empty-field' }),
    province: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().min(1, { message: 'empty-field' }),
  });
  const formDataSchema = z.union([copyHomeAddressSchema, addressFormSchema]);

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof addressFormSchema>>,
    });
  }

  const { copyHomeAddress } = formData as Partial<z.infer<typeof copyHomeAddressSchema>>;
  if (copyHomeAddress) {
    const userService = getUserService();
    const userId = await userService.getUserId();
    const userInfo = await userService.getUserInfo(userId);
    if (!userInfo) {
      throw new Response(null, { status: 404 });
    }

    const homeAddress = await getAddressService().getAddressInfo(userId, userInfo.homeAddress ?? '');
    session.set('newMailingAddress', homeAddress);
  } else {
    session.set('newMailingAddress', parsedDataResult.data);
  }

  return redirectWithLocale(request, '/personal-information/mailing-address/confirm');
}

export default function PersonalInformationMailingAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, countryList, regionList, csrfToken, CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const [selectedCountry, setSelectedCountry] = useState(addressInfo?.country);
  const [countryRegions, setCountryRegions] = useState<typeof regionList>([]);
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const errorSummaryId = 'error-summary';
  const [copyAddressChecked, setCopyAddressChecked] = useState(false);

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.countryId === selectedCountry);
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

  const countries: InputOptionProps[] = countryList
    .map((country) => {
      return {
        children: i18n.language === 'fr' ? country.nameFr : country.nameEn,
        value: country.countryId,
        id: country.countryId,
      };
    })
    .sort((country1, country2) => country1.children.localeCompare(country2.children));

  // populate region/province/state list with selected country or current address country
  const regions: InputOptionProps[] = (selectedCountry ? countryRegions : regionList.filter((region) => region.countryId === defaultValues.country))
    .map((region) => {
      return {
        children: i18n.language === 'fr' ? region.nameFr : region.nameEn,
        value: region.provinceTerritoryStateId,
        id: region.provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

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
      <Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <div className="space-y-6">
            <InputField
              id="address"
              className="w-full"
              label={t('personal-information:mailing-address.edit.field.address')}
              helpMessagePrimary={t('personal-information:mailing-address.edit.field.address-note')}
              name="address"
              required
              defaultValue={defaultValues.address}
              errorMessage={errorMessages.address}
            />
            <InputField id="apartment" name="apartment" className="w-full" label={t('personal-information:home-address.edit.field.apartment')} />
            <InputSelect
              id="country"
              className="w-full sm:w-1/2"
              label={t('personal-information:mailing-address.edit.field.country')}
              name="country"
              required
              options={countries}
              onChange={countryChangeHandler}
              defaultValue={defaultValues.country}
              errorMessage={errorMessages.country}
            />
            {regions.length > 0 && (
              <InputSelect id="province" className="w-full sm:w-1/2" label={t('personal-information:mailing-address.edit.field.province')} name="province" options={regions} defaultValue={defaultValues.province} errorMessage={errorMessages.province} />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="city" className="w-full" label={t('personal-information:mailing-address.edit.field.city')} name="city" required defaultValue={defaultValues.city} errorMessage={errorMessages.city} />
              <InputField
                id="postalCode"
                className="w-full"
                label={t('personal-information:mailing-address.edit.field.postal-code')}
                name="postalCode"
                defaultValue={defaultValues.postalCode}
                errorMessage={errorMessages.postalCode}
                required={selectedCountry === CANADA_COUNTRY_ID || selectedCountry === USA_COUNTRY_ID}
              />
            </div>
          </div>

          <InputCheckbox id="copyAddressChecked" name="copyAddressChecked" value="copy" checked={copyAddressChecked} onChange={checkHandler} className="my-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="personal-information:mailing-address.edit.update-home-address" />
            <p>{t('personal-information:mailing-address.edit.update-home-address-note')}</p>
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/personal-information">
            {t('personal-information:mailing-address.edit.button.back')}
          </ButtonLink>
          <Button id="save-button" variant="primary">
            {t('personal-information:mailing-address.edit.button.save')}
          </Button>
        </div>
      </Form>
    </>
  );
}

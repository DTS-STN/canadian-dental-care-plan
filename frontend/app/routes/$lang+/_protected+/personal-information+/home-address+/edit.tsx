import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { getAddressService } from '~/services/address-service.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getWSAddressService } from '~/services/wsaddress-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.home-address-change' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.homeAddressEdit,
  pageTitleI18nKey: 'personal-information:home-address.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const addressService = getAddressService();
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const addressInfo = await addressService.getAddressInfo(userId, userInfo?.homeAddress ?? '');
  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  if (!userInfo) {
    instrumentationService.countHttpStatus('home-address.edit', 404);
    throw new Response(null, { status: 404 });
  }

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:home-address.edit.page-title') }) };

  instrumentationService.countHttpStatus('home-address.edit', 302);
  return json({ addressInfo, countryList, csrfToken, meta, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const log = getLogger('home-address/edit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const wsAddressService = await getWSAddressService();

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    address: z.string().trim().min(1, { message: 'empty-field' }),
    city: z.string().trim().min(1, { message: 'empty-field' }),
    province: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().min(1, { message: 'empty-field' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('home-address.edit', 400);
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }
  const newHomeAddress = parsedDataResult.data;
  session.set('newHomeAddress', newHomeAddress);

  const { address, city, country, postalCode, province } = parsedDataResult.data;
  const correctedAddress = await wsAddressService.correctAddress({ address, city, country, postalCode, province });

  instrumentationService.countHttpStatus('home-address.edit', 302);
  if (correctedAddress.status === 'Corrected') {
    const { address, city, province, postalCode, country } = correctedAddress;
    session.set('suggestedAddress', { address, city, province, postalCode, country });
    return redirectWithLocale(request, '/personal-information/home-address/suggested');
  }
  if (correctedAddress.status === 'NotCorrect') {
    return redirectWithLocale(request, '/personal-information/home-address/address-accuracy');
  }
  const addressService = getAddressService();
  const userService = getUserService();

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  await addressService.updateAddressInfo(userId, userInfo?.homeAddress ?? '', newHomeAddress);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.home-address', { userId: idToken.sub });

  const locale = getLocale(request);
  return redirectWithSuccess(`/${locale}/personal-information`, 'personal-information:home-address.edit.updated-notification');
}

export default function PersonalInformationHomeAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, countryList, csrfToken, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const [selectedCountry, setSelectedCountry] = useState(addressInfo?.country);
  const [countryRegions, setCountryRegions] = useState<typeof regionList>([]);
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const errorSummaryId = 'error-summary';

  useEffect(() => {
    const filteredRegions = regionList.filter((region) => region.countryId === selectedCountry);
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
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <div className="space-y-6">
            <InputField
              id="address"
              className="w-full"
              label={t('personal-information:home-address.edit.field.address')}
              helpMessagePrimary={t('personal-information:home-address.edit.field.address-note')}
              name="address"
              required
              defaultValue={defaultValues.address}
              errorMessage={errorMessages.address}
            />
            <InputField id="apartment" name="apartment" className="w-full" label={t('personal-information:home-address.edit.field.apartment')} />
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
            {regions.length > 0 && (
              <InputSelect id="province" className="w-full sm:w-1/2" label={t('personal-information:home-address.edit.field.province')} name="province" defaultValue={defaultValues.province} options={regions} errorMessage={errorMessages.province} />
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="city" className="w-full" label={t('personal-information:home-address.edit.field.city')} name="city" required defaultValue={defaultValues.city} errorMessage={errorMessages.city} />
              <InputField
                id="postalCode"
                className="w-full"
                label={t('personal-information:home-address.edit.field.postal-code')}
                name="postalCode"
                defaultValue={defaultValues.postalCode}
                errorMessage={errorMessages.postalCode}
                required={selectedCountry === CANADA_COUNTRY_ID || selectedCountry === USA_COUNTRY_ID}
              />
            </div>
          </div>

          <InputCheckbox id="updateMailingAddress" name="updaetMailingAddress" value="copy" className="my-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="personal-information:home-address.edit.update-mailing-address" />
            <p>{t('personal-information:home-address.edit.update-mailing-address-note')}</p>
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/personal-information">
            {t('personal-information:home-address.edit.button.back')}
          </ButtonLink>
          <Button id="save-button" variant="primary">
            {t('personal-information:home-address.edit.button.save')}
          </Button>
        </div>
      </Form>
    </>
  );
}

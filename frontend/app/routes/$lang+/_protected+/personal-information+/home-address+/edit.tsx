import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useParams } from '@remix-run/react';

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
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getWSAddressService } from '~/services/wsaddress-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
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

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const addressInfo = personalInformation.homeAddress;

  if (!addressInfo) {
    instrumentationService.countHttpStatus('home-address.edit', 404);
    throw new Response(null, { status: 404 });
  }

  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:home-address.edit.page-title') }) };

  instrumentationService.countHttpStatus('home-address.edit', 302);
  return json({ addressInfo, countryList, csrfToken, meta, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('home-address/edit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const wsAddressService = await getWSAddressService();

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    streetName: z.string().trim().min(1, { message: 'empty-field' }),
    secondAddressLine: z.string().trim().optional(),
    cityName: z.string().trim().min(1, { message: 'empty-field' }),
    provinceTerritoryStateId: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    countryId: z.string().trim().min(1, { message: 'empty-field' }),
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

  const { streetName, cityName, countryId, postalCode, provinceTerritoryStateId } = parsedDataResult.data;
  const correctedAddress = await wsAddressService.correctAddress({ address: streetName, city: cityName, province: provinceTerritoryStateId, postalCode: postalCode, country: countryId });

  instrumentationService.countHttpStatus('home-address.edit', 302);
  if (correctedAddress.status === 'Corrected') {
    const { address, city, province, postalCode, country } = correctedAddress;
    session.set('suggestedAddress', { address, city, province, postalCode, country });
    return redirect(getPathById('$lang+/_protected+/personal-information+/home-address+/suggested', params));
  }

  if (correctedAddress.status === 'NotCorrect') {
    return redirect(getPathById('$lang+/_protected+/personal-information+/home-address+/address-accuracy', params));
  }

  //TODO: need updatePersonalInfo to update home address
  //await addressService.updateAddressInfo(userId, userInfo?.homeAddress ?? '', newHomeAddress);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.home-address', { userId: idToken.sub });

  return redirectWithSuccess(getPathById('$lang+/_protected+/personal-information+/index', params), 'personal-information:home-address.edit.updated-notification');
}

export default function PersonalInformationHomeAddressEdit() {
  const actionData = useActionData<typeof action>();
  const { addressInfo, countryList, csrfToken, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const params = useParams();
  const [selectedCountry, setSelectedCountry] = useState(addressInfo.countryId);
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
    streetName: actionData?.formData.streetName ?? addressInfo.streetName,
    secondAddressLine: actionData?.formData.secondAddressLine ?? addressInfo.secondAddressLine,
    cityName: actionData?.formData.cityName ?? addressInfo.cityName,
    provinceTerritoryStateId: actionData?.formData.provinceTerritoryStateId ?? addressInfo.provinceTerritoryStateId,
    countryId: actionData?.formData.countryId ?? addressInfo.countryId,
    postalCode: actionData?.formData.postalCode ?? addressInfo.postalCode,
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
  const regions: InputOptionProps[] = (selectedCountry ? countryRegions : regionList.filter((region) => region.countryId === defaultValues.countryId))
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
    streetName: getErrorMessage(actionData?.errors.fieldErrors.streetName?.[0]),
    cityName: getErrorMessage(actionData?.errors.fieldErrors.cityName?.[0]),
    provinceTerritoryStateId: getErrorMessage(actionData?.errors.fieldErrors.provinceTerritoryStateId?.[0]),
    postalCode: getErrorMessage(actionData?.errors.fieldErrors.postalCode?.[0]),
    countryId: getErrorMessage(actionData?.errors.fieldErrors.countryId?.[0]),
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
              id="streetName"
              className="w-full"
              label={t('personal-information:home-address.edit.field.address')}
              helpMessagePrimary={t('personal-information:home-address.edit.field.address-note')}
              name="streetName"
              required
              defaultValue={defaultValues.streetName}
              errorMessage={errorMessages.streetName}
            />
            <InputField id="secondAddressLine" name="secondAddressLine" className="w-full" label={t('personal-information:home-address.edit.field.apartment')} defaultValue={defaultValues.secondAddressLine} />
            <InputSelect
              id="countryId"
              className="w-full sm:w-1/2"
              label={t('personal-information:home-address.edit.field.country')}
              name="countryId"
              defaultValue={defaultValues.countryId}
              required
              options={countries}
              onChange={countryChangeHandler}
              errorMessage={errorMessages.countryId}
            />
            {regions.length > 0 && (
              <InputSelect
                id="provinceTerritoryStateId"
                className="w-full sm:w-1/2"
                label={t('personal-information:home-address.edit.field.province')}
                name="provinceTerritoryStateId"
                defaultValue={defaultValues.provinceTerritoryStateId}
                options={regions}
                errorMessage={errorMessages.provinceTerritoryStateId}
              />
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="cityName" className="w-full" label={t('personal-information:home-address.edit.field.city')} name="cityName" required defaultValue={defaultValues.cityName} errorMessage={errorMessages.cityName} />
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

          <InputCheckbox id="copyAddressChecked" name="copyAddressChecked" value="copy" className="my-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="personal-information:home-address.edit.update-mailing-address" />
            <p>{t('personal-information:home-address.edit.update-mailing-address-note')}</p>
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" routeId="$lang+/_protected+/personal-information+/index" params={params}>
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

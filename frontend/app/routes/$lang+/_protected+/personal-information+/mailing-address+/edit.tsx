import { useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';
import validator from 'validator';
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
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import { IdToken, UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.edit.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
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

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('edit-personal-info');
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);
  const addressInfo = personalInformation.mailingAddress;

  if (!addressInfo) {
    instrumentationService.countHttpStatus('home-address.edit', 404);
    throw new Response(null, { status: 404 });
  }

  const csrfToken = String(session.get('csrfToken'));

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.edit.page-title') }) };

  instrumentationService.countHttpStatus('mailing-address.edit', 302);
  return json({ addressInfo, countryList, csrfToken, meta, regionList, CANADA_COUNTRY_ID, USA_COUNTRY_ID });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('mailing-address/edit');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const formDataSchema = z
    .object({
      streetName: z.string().trim().min(1, t('personal-information:mailing-address.edit.error-message.address-required')).max(30),
      secondAddressLine: z.string().trim().max(30).optional(),
      countryId: z.string().trim().min(1, t('personal-information:mailing-address.edit.error-message.country-required')),
      provinceTerritoryStateId: z.string().trim().min(1, t('personal-information:mailing-address.edit.error-message.province-required')).optional(),
      cityName: z.string().trim().min(1, t('personal-information:mailing-address.edit.error-message.city-required')).max(100),
      postalCode: z.string().trim().max(100).optional(),
      homeAndMailingAddressTheSame: z.boolean(),
    })
    .superRefine((val, ctx) => {
      if (val.countryId === CANADA_COUNTRY_ID || val.countryId === USA_COUNTRY_ID) {
        if (!val.provinceTerritoryStateId || validator.isEmpty(val.provinceTerritoryStateId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('personal-information:home-address.edit.error-message.province-required'), path: ['provinceTerritoryStateId'] });
        }

        if (!val.postalCode || validator.isEmpty(val.postalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('personal-information:home-address.edit.error-message.postal-code-required'), path: ['postalCode'] });
        } else if (!isValidPostalCode(val.countryId, val.postalCode)) {
          const message = val.countryId === CANADA_COUNTRY_ID ? t('personal-information:home-address.edit.error-message.postal-code-valid') : t('personal-information:home-address.edit.error-message.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['postalCode'] });
        }
      }
    })
    .transform((val) => {
      return {
        ...val,
        postalCode: val.countryId && val.postalCode ? formatPostalCode(val.countryId, val.postalCode) : val.postalCode,
      };
    });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    streetName: String(formData.get('streetName') ?? ''),
    secondAddressLine: formData.get('secondAddressLine') ? String(formData.get('secondAddressLine')) : undefined,
    countryId: String(formData.get('countryId') ?? ''),
    provinceTerritoryStateId: formData.get('provinceTerritoryStateId') ? String(formData.get('provinceTerritoryStateId')) : undefined,
    cityName: String(formData.get('cityName') ?? ''),
    postalCode: formData.get('postalCode') ? String(formData.get('postalCode')) : undefined,
    homeAndMailingAddressTheSame: formData.get('homeAndMailingAddressTheSame') === 'copy',
  };
  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  instrumentationService.countHttpStatus('mailing-address.edit', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformationServie = getPersonalInformationService();
  const personalInformationRouteHelpers = getPersonalInformationRouteHelpers();
  const personalInformation = await personalInformationRouteHelpers.getPersonalInformation(userInfoToken, params, request, session);

  const { streetName, secondAddressLine, countryId, provinceTerritoryStateId, cityName, postalCode } = parsedDataResult.data;

  const newPersonalInformation = {
    ...personalInformation,
    mailingAddress: {
      streetName,
      secondAddressLine,
      countryId,
      provinceTerritoryStateId,
      cityName,
      postalCode,
    },
    homeAndMailingAddressTheSame: parsedDataResult.data.homeAndMailingAddressTheSame,
    homeAddress: parsedDataResult.data.homeAndMailingAddressTheSame
      ? {
          streetName,
          secondAddressLine,
          countryId,
          provinceTerritoryStateId,
          cityName,
          postalCode,
        }
      : personalInformation.homeAddress,
  };
  await personalInformationServie.updatePersonalInformation(userInfoToken.sin ?? '', newPersonalInformation);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.mailing-address', { userId: idToken.sub });

  return redirectWithSuccess(getPathById('$lang+/_protected+/personal-information+/index', params), 'personal-information:mailing-address.edit.updated-notification');
}

export default function PersonalInformationMailingAddressEdit() {
  const fetcher = useFetcher<typeof action>();
  const { addressInfo, countryList, regionList, csrfToken, CANADA_COUNTRY_ID, USA_COUNTRY_ID } = useLoaderData<typeof loader>();
  const params = useParams();
  const [selectedCountry, setSelectedCountry] = useState(addressInfo.countryId);
  const [countryRegions, setCountryRegions] = useState<typeof regionList>([]);
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const errorSummaryId = 'error-summary';
  const [copyAddressChecked, setCopyAddressChecked] = useState(false);

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'street-name': fetcher.data?.errors.streetName?._errors[0],
      'apartment-number': fetcher.data?.errors.secondAddressLine?._errors[0],
      'country-id': fetcher.data?.errors.countryId?._errors[0],
      'province-id': fetcher.data?.errors.provinceTerritoryStateId?._errors[0],
      'city-name': fetcher.data?.errors.cityName?._errors[0],
      'postal-code': fetcher.data?.errors.postalCode?._errors[0],
    }),
    [
      fetcher.data?.errors.streetName?._errors,
      fetcher.data?.errors.secondAddressLine?._errors,
      fetcher.data?.errors.countryId?._errors,
      fetcher.data?.errors.provinceTerritoryStateId?._errors,
      fetcher.data?.errors.cityName?._errors,
      fetcher.data?.errors.postalCode?._errors,
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

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
  const regions: InputOptionProps[] = (selectedCountry ? countryRegions : regionList.filter((region) => region.countryId === addressInfo.countryId))
    .map((region) => {
      return {
        children: i18n.language === 'fr' ? region.nameFr : region.nameEn,
        value: region.provinceTerritoryStateId,
        id: region.provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <div className="space-y-6">
            <InputField
              id="street-name"
              name="streetName"
              className="w-full"
              label={t('personal-information:mailing-address.edit.field.address')}
              maxLength={30}
              helpMessagePrimary={t('personal-information:mailing-address.edit.field.address-note')}
              required
              defaultValue={addressInfo.streetName}
              errorMessage={errorMessages['street-name']}
            />
            <InputField
              id="apartment-number"
              name="secondAddressLine"
              className="w-full"
              label={t('personal-information:home-address.edit.field.apartment')}
              maxLength={30}
              defaultValue={addressInfo.secondAddressLine}
              errorMessage={errorMessages['apartment-number']}
            />
            <InputSelect
              id="country-id"
              name="countryId"
              className="w-full sm:w-1/2"
              label={t('personal-information:mailing-address.edit.field.country')}
              required
              options={countries}
              onChange={countryChangeHandler}
              defaultValue={addressInfo.countryId}
              errorMessage={errorMessages['country-id']}
            />
            {regions.length > 0 && (
              <InputSelect
                id="province-id"
                name="provinceTerritoryStateId"
                className="w-full sm:w-1/2"
                label={t('personal-information:mailing-address.edit.field.province')}
                required
                options={regions}
                defaultValue={addressInfo.provinceTerritoryStateId}
                errorMessage={errorMessages['province-id']}
              />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="city-name" name="cityName" className="w-full" label={t('personal-information:mailing-address.edit.field.city')} maxLength={100} required defaultValue={addressInfo.cityName} errorMessage={errorMessages['city-name']} />
              <InputField
                id="postal-code"
                name="postalCode"
                className="w-full"
                label={t('personal-information:mailing-address.edit.field.postal-code')}
                maxLength={100}
                defaultValue={addressInfo.postalCode}
                errorMessage={errorMessages['postal-code']}
                required={selectedCountry === CANADA_COUNTRY_ID || selectedCountry === USA_COUNTRY_ID}
              />
            </div>
          </div>

          <InputCheckbox id="homeAndMailingAddressTheSame" name="homeAndMailingAddressTheSame" value="copy" checked={copyAddressChecked} onChange={checkHandler} className="my-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="personal-information:mailing-address.edit.update-home-address" />
            <p>{t('personal-information:mailing-address.edit.update-home-address-note')}</p>
          </InputCheckbox>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" routeId="$lang+/_protected+/personal-information+/index" params={params}>
            {t('personal-information:mailing-address.edit.button.back')}
          </ButtonLink>
          <Button id="save-button" variant="primary">
            {t('personal-information:mailing-address.edit.button.save')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}

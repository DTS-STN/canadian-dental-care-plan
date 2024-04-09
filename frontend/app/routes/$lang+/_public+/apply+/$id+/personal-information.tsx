import { useEffect, useMemo, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { formatPostalCode, isValidPostalCode } from '~/utils/postal-zip-code-utils.server';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type PersonalInformationState = {
  copyMailingAddress: boolean;
  homeAddress?: string;
  homeApartment?: string;
  homeCity?: string;
  homeCountry?: string;
  homePostalCode?: string;
  homeProvince?: string;
  mailingAddress: string;
  mailingApartment?: string;
  mailingCity: string;
  mailingCountry: string;
  mailingPostalCode?: string;
  mailingProvince?: string;
  phoneNumber?: string;
  phoneNumberAlt?: string;
};

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.personalInformation,
  pageTitleI18nKey: 'apply:personal-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const lookupService = getLookupService();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID, MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED } = getEnv();

  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:personal-information.page-title') }) };

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

  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { CANADA_COUNTRY_ID, USA_COUNTRY_ID } = getEnv();

  const personalInformationSchema: z.ZodType<PersonalInformationState> = z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val), t('apply:personal-information.error-message.phone-number-valid'))
        .transform((val) => parsePhoneNumber(val).formatInternational())
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val), t('apply:personal-information.error-message.phone-number-alt-valid'))
        .transform((val) => parsePhoneNumber(val).formatInternational())
        .optional(),
      mailingAddress: z.string().trim().min(1, t('apply:personal-information.error-message.address-required')).max(30),
      mailingApartment: z.string().trim().max(30).optional(),
      mailingCountry: z.string().trim().min(1, t('apply:personal-information.error-message.country-required')),
      mailingProvince: z.string().trim().min(1, t('apply:personal-information.error-message.province-required')).optional(),
      mailingCity: z.string().trim().min(1, t('apply:personal-information.error-message.city-required')).max(100),
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
      if (val.mailingCountry === CANADA_COUNTRY_ID || val.mailingCountry === USA_COUNTRY_ID) {
        if (!val.mailingProvince || validator.isEmpty(val.mailingProvince)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.province-required'), path: ['mailingProvince'] });
        }

        if (!val.mailingPostalCode || validator.isEmpty(val.mailingPostalCode)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.postal-code-required'), path: ['mailingPostalCode'] });
        } else if (!isValidPostalCode(val.mailingCountry, val.mailingPostalCode)) {
          const message = val.mailingCountry === CANADA_COUNTRY_ID ? t('apply:personal-information.error-message.postal-code-valid') : t('apply:personal-information.error-message.zip-code-valid');
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['mailingPostalCode'] });
        }
      }

      if (val.copyMailingAddress === false) {
        if (!val.homeAddress || validator.isEmpty(val.homeAddress)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.address-required'), path: ['homeAddress'] });
        }

        if (!val.homeCountry || validator.isEmpty(val.homeCountry)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.country-required'), path: ['homeCountry'] });
        }

        if (!val.homeCity || validator.isEmpty(val.homeCity)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.city-required'), path: ['homeCity'] });
        }

        if (val.homeCountry === CANADA_COUNTRY_ID || val.homeCountry === USA_COUNTRY_ID) {
          if (!val.homeProvince || validator.isEmpty(val.homeProvince)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.province-required'), path: ['homeProvince'] });
          }

          if (!val.homePostalCode || validator.isEmpty(val.homePostalCode)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:personal-information.error-message.postal-code-required'), path: ['homePostalCode'] });
          } else if (!isValidPostalCode(val.homeCountry, val.homePostalCode)) {
            const message = val.mailingCountry === CANADA_COUNTRY_ID ? t('apply:personal-information.error-message.postal-code-valid') : t('apply:personal-information.error-message.zip-code-valid');
            ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['homePostalCode'] });
          }
        }
      }
    })
    .transform((val) => {
      return {
        ...val,
        mailingPostalCode: val.mailingCountry && val.mailingPostalCode ? formatPostalCode(val.mailingCountry, val.mailingPostalCode) : val.mailingPostalCode,
        homePostalCode: val.homeCountry && val.homePostalCode ? formatPostalCode(val.homeCountry, val.homePostalCode) : val.homePostalCode,
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
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
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

  await applyRouteHelpers.saveState({ params, request, session, state: { personalInformation: updatedData } });

  if (state.editMode) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/review-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/communication-preference', params));
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
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
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
    .sort((country1, country2) => country1.children.localeCompare(country2.children));

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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <InputField id="phone-number" name="phoneNumber" className="w-full" defaultValue={defaultState?.phoneNumber ?? ''} errorMessage={errorMessages['phone-number']} label={t('apply:personal-information.phone-number')} maxLength={100} />
            <InputField
              id="phone-number-alt"
              name="phoneNumberAlt"
              className="w-full"
              defaultValue={defaultState?.phoneNumberAlt ?? ''}
              errorMessage={errorMessages['phone-number-alt']}
              label={t('apply:personal-information.phone-number-alt')}
              maxLength={100}
            />
          </div>
          <h2 className="mb-4 font-lato text-2xl font-bold">{t('apply:personal-information.mailing-address.header')}</h2>
          <div className="my-6 space-y-6">
            <InputField
              id="mailing-address"
              name="mailingAddress"
              className="w-full"
              label={t('apply:personal-information.address-field.address')}
              maxLength={30}
              helpMessagePrimary={t('apply:personal-information.address-field.address-note')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.mailingAddress ?? ''}
              errorMessage={errorMessages['mailing-address']}
              required
            />
            <InputField
              id="mailing-apartment"
              name="mailingApartment"
              className="w-full"
              label={t('apply:personal-information.address-field.apartment')}
              maxLength={30}
              defaultValue={defaultState?.mailingApartment ?? ''}
              errorMessage={errorMessages['mailing-apartment']}
            />
            <InputSelect
              id="mailing-country"
              name="mailingCountry"
              className="w-full sm:w-1/2"
              label={t('apply:personal-information.address-field.country')}
              defaultValue={defaultState?.mailingCountry ?? ''}
              errorMessage={errorMessages['mailing-country']}
              required
              options={[dummyOption, ...countries]}
              onChange={mailingCountryChangeHandler}
            />
            {mailingRegions.length > 0 && (
              <InputSelect
                id="mailing-province"
                name="mailingProvince"
                className="w-full sm:w-1/2"
                label={t('apply:personal-information.address-field.province')}
                defaultValue={defaultState?.mailingProvince ?? ''}
                errorMessage={errorMessages['mailing-province']}
                required
                options={[dummyOption, ...mailingRegions]}
              />
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="mailing-city"
                name="mailingCity"
                className="w-full"
                label={t('apply:personal-information.address-field.city')}
                maxLength={100}
                defaultValue={defaultState?.mailingCity ?? ''}
                errorMessage={errorMessages['mailing-city']}
                required
              />
              <InputField
                id="mailing-postal-code"
                name="mailingPostalCode"
                className="w-full"
                label={t('apply:personal-information.address-field.postal-code')}
                maxLength={100}
                defaultValue={defaultState?.mailingPostalCode}
                errorMessage={errorMessages['mailing-postal-code']}
                required={selectedMailingCountry === CANADA_COUNTRY_ID || selectedMailingCountry === USA_COUNTRY_ID}
              />
            </div>
          </div>

          <h2 className="mb-6 font-lato text-2xl font-bold">{t('apply:personal-information.home-address.header')}</h2>
          <div className="mb-8 space-y-6">
            <InputCheckbox id="copyMailingAddress" name="copyMailingAddress" value="copy" checked={copyAddressChecked} onChange={checkHandler}>
              {t('apply:personal-information.home-address.use-mailing-address')}
            </InputCheckbox>
            {!copyAddressChecked && (
              <>
                <InputField
                  id="home-address"
                  name="homeAddress"
                  className="w-full"
                  label={t('apply:personal-information.address-field.address')}
                  helpMessagePrimary={t('apply:personal-information.address-field.address-note')}
                  helpMessagePrimaryClassName="text-black"
                  maxLength={30}
                  defaultValue={defaultState?.homeAddress ?? ''}
                  errorMessage={errorMessages['home-address']}
                  required
                />
                <InputField
                  id="home-apartment"
                  name="homeApartment"
                  className="w-full"
                  label={t('apply:personal-information.address-field.apartment')}
                  maxLength={30}
                  defaultValue={defaultState?.homeApartment ?? ''}
                  errorMessage={errorMessages['home-apartment']}
                />
                <InputSelect
                  id="home-country"
                  name="homeCountry"
                  className="w-full sm:w-1/2"
                  label={t('apply:personal-information.address-field.country')}
                  defaultValue={defaultState?.homeCountry ?? ''}
                  errorMessage={errorMessages['home-country']}
                  required
                  options={[dummyOption, ...countries]}
                  onChange={homeCountryChangeHandler}
                />
                {homeRegions.length > 0 && (
                  <InputSelect
                    id="home-province"
                    name="homeProvince"
                    className="w-full sm:w-1/2"
                    label={t('apply:personal-information.address-field.province')}
                    defaultValue={defaultState?.homeProvince ?? ''}
                    errorMessage={errorMessages['home-province']}
                    required
                    options={[dummyOption, ...homeRegions]}
                  />
                )}
                <div className="mb-6 grid gap-6 md:grid-cols-2">
                  <InputField id="home-city" name="homeCity" className="w-full" label={t('apply:personal-information.address-field.city')} maxLength={100} defaultValue={defaultState?.homeCity ?? ''} errorMessage={errorMessages['home-city']} required />
                  <InputField
                    id="home-postal-code"
                    name="homePostalCode"
                    className="w-full"
                    label={t('apply:personal-information.address-field.postal-code')}
                    maxLength={100}
                    defaultValue={defaultState?.homePostalCode ?? ''}
                    errorMessage={errorMessages['home-postal-code']}
                    required={selectedHomeCountry === CANADA_COUNTRY_ID || selectedHomeCountry === USA_COUNTRY_ID}
                  />
                </div>
              </>
            )}
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                {t('apply:personal-information.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/review-information" params={params} disabled={isSubmitting}>
                {t('apply:personal-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                {t('apply:personal-information.continue')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink
                id="back-button"
                routeId={[MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED].includes(Number(maritalStatus)) ? '$lang+/_public+/apply+/$id+/partner-information' : '$lang+/_public+/apply+/$id+/applicant-information'}
                params={params}
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply:personal-information.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

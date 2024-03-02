import { useEffect, useState } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputField } from '~/components/input-field';
import { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { RegionInfo, getLookupService } from '~/services/lookup-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('apply');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:personal-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  return json({ id, state: state.personalInfo, countryList, regionList });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.personalInfoStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.personalInfoStateSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { personalInfo: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/email`, sessionResponseInit);
}

export default function ApplyFlowPersonalInformation() {
  const { countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [selectedMailingCountry, setSelectedMailingCountry] = useState('');
  const [mailingCountryRegions, setMailingCountryRegions] = useState<RegionInfo[]>([]);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [selectedHomeCountry, setSelectedHomeCountry] = useState('');
  const [homeCountryRegions, setHomeCountryRegions] = useState<RegionInfo[]>([]);

  const copyMailingAddressHandler = () => {
    setUseDifferentAddress(false);
    //reset selected home country if copy mailing address radio is clicked
    setSelectedHomeCountry('');
  };

  const useDifferentAddressHandler = () => {
    //display address input fields to enter home address
    setUseDifferentAddress(true);
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
        children: i18n.language === 'fr' ? country.nameFrench : country.nameEnglish,
        value: country.countryId,
        id: country.countryId,
      };
    })
    .sort((country1, country2) => country1.children.localeCompare(country2.children));

  // populate mailing region/province/state list with selected country or current address country
  const mailingRegions: InputOptionProps[] = mailingCountryRegions
    .map((region) => {
      return {
        children: i18n.language === 'fr' ? region.nameFrench : region.nameEnglish,
        value: region.provinceTerritoryStateId,
        id: region.provinceTerritoryStateId,
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
        children: i18n.language === 'fr' ? region.nameFrench : region.nameEnglish,
        value: region.provinceTerritoryStateId,
        id: region.provinceTerritoryStateId,
      };
    })
    .sort((region1, region2) => region1.children.localeCompare(region2.children));

  const dummyOption: InputOptionProps = { children: t('apply:personal-information.address-field.select-one'), value: '' };

  return (
    <>
      <p id="form-instructions" className="mb-6">
        {t('apply:personal-information.form-instructions')}
      </p>
      <Form method="post" noValidate>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <InputField id="phone-number" name="phoneNumber" className="w-full" label={t('apply:personal-information.telephone-number')} />
          <InputField id="phone-number-alt" name="phoneNumberAlt" className="w-full" label={t('apply:personal-information.telephone-number-alt')} />
        </div>
        <div className="mb-6">
          <p className="text-2xl font-semibold"> {t('apply:personal-information.mailing-address.header')}</p>
          <p className="mb-4"> {t('apply:personal-information.mailing-address.note')}</p>
          <div className="max-w-prose space-y-6">
            <InputField id="mailing-address" name="mailingAddress" className="w-full" label={t('apply:personal-information.address-field.address')} required />
            <InputField id="mailing-apartment" name="mailingApartment" className="w-full" label={t('apply:personal-information.address-field.apartment')} />
            <InputSelect id="mailing-country" name="mailingCountry" className="w-full sm:w-1/2" label={t('apply:personal-information.address-field.country')} required options={[dummyOption, ...countries]} onChange={mailingCountryChangeHandler} />
            {mailingRegions.length > 0 && <InputSelect id="mailing-province" name="mailingProvince" className="w-full sm:w-1/2" label={t('apply:personal-information.address-field.province')} required options={[dummyOption, ...mailingRegions]} />}
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <InputField id="mailing-city" name="mailingCity" label={t('apply:personal-information.address-field.city')} required />
              <InputField id="mailing-postalCode" name="mailingPostalCode" label={t('apply:personal-information.address-field.postal-code')} />
            </div>
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold"> {t('apply:personal-information.home-address.header')}</p>
          <div className="my-6">
            <InputRadios
              id="home-address"
              legend=""
              name="copyHomeAddress"
              options={[
                {
                  children: t('apply:personal-information.home-address.use-mailing-address'),
                  onClick: copyMailingAddressHandler,
                  value: 'true',
                },
                {
                  children: t('apply:personal-information.home-address.use-different-address'),
                  onClick: useDifferentAddressHandler,
                  value: 'false',
                },
              ]}
            />
          </div>
          {useDifferentAddress && (
            <div className="max-w-prose space-y-6">
              <InputField id="home-address" name="homeAddress" className="w-full" label={t('apply:personal-information.address-field.address')} required />
              <InputField id="home-apartment" name="homeApartment" className="w-full" label={t('apply:personal-information.address-field.apartment')} />
              <InputSelect id="home-country" name="homeCountry" className="w-full sm:w-1/2" label={t('apply:personal-information.address-field.country')} required options={[dummyOption, ...countries]} onChange={homeCountryChangeHandler} />
              {homeRegions.length > 0 && <InputSelect id="home-province" name="homeProvince" className="w-full sm:w-1/2" label={t('apply:personal-information.address-field.province')} required options={[dummyOption, ...homeRegions]} />}
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <InputField id="home-city" name="homeCity" label={t('apply:personal-information.address-field.city')} required />
                <InputField id="home-postalCode" name="homePostalCode" label={t('apply:personal-information.address-field.postal-code')} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/apply">
            {t('apply:personal-information.back')}
          </ButtonLink>
          <Button id="continue-button" variant="primary">
            {t('apply:personal-information.continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}

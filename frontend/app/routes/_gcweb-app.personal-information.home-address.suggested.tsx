import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.suggested-address' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0008',
  pageTitleI18nKey: 'personal-information:home-address.suggested.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const sessionService = await getSessionService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  //
  // TODO
  // CHANGE THE SOURCE OF THE SUGGESTED ADDRESS TO WHAT WS ADDRESS SERVICE IS RETURNING INSTEAD OF MAILING ADDRESS
  //
  const suggestedAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const session = await sessionService.getSession(request);
  session.set('homeAddress', homeAddressInfo);
  session.set('suggestedAddress', suggestedAddressInfo);

  return json({ homeAddressInfo, suggestedAddressInfo, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const sessionService = await getSessionService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
  //
  // TODO
  // CHANGE THE SOURCE OF THE SUGGESTED ADDRESS TO WHAT WS ADDRESS SERVICE IS RETURNING INSTEAD OF MAILING ADDRESS
  //
  const suggestedAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const formDataRadio = Object.fromEntries(await request.formData());
  //retrieve selected address, store it in the session and then redirect to the confirm page...
  const session = await sessionService.getSession(request);
  if (formDataRadio.selectedAddress === 'home') {
    session.set('newHomeAddress', homeAddressInfo);
  } else {
    session.set('newHomeAddress', suggestedAddressInfo);
  }
  return redirect('/personal-information/home-address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function HomeAddressSuggested() {
  const { homeAddressInfo, suggestedAddressInfo, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:home-address.suggested.subtitle')}</p>
      <Form method="post">
        <p className="mb-4">{t('personal-information:home-address.suggested.note')}</p>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-medium">{t('personal-information:home-address.suggested.address-entered')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {homeAddressInfo ? (
                <Address
                  address={homeAddressInfo.address}
                  city={homeAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === homeAddressInfo.province)?.provinceTerritoryStateId}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={countryList.find((country) => country.countryId === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFrench' : 'nameEnglish'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-medium">{t('personal-information:home-address.suggested.address-suggested')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {suggestedAddressInfo ? (
                <Address
                  address={suggestedAddressInfo.address}
                  city={suggestedAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === suggestedAddressInfo.province)?.provinceTerritoryStateId}
                  postalZipCode={suggestedAddressInfo.postalCode}
                  country={countryList.find((country) => country.countryId === suggestedAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFrench' : 'nameEnglish'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
        </dl>
        <InputRadios
          id="selected-address"
          name="selectedAddress"
          legend={t('personal-information:home-address.suggested.choose-address')}
          options={[
            { value: 'home', children: t('personal-information:home-address.suggested.use-entered') },
            { value: 'suggested', children: t('personal-information:home-address.suggested.use-suggested') },
          ]}
          required
        />
        <p className="mb-4">{t('personal-information:home-address.suggested.re-enter-address')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:home-address.suggested.continue')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/">
            {t('personal-information:home-address.suggested.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" to="/personal-information/home-address/edit">
            {t('personal-information:home-address.suggested.edit')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}

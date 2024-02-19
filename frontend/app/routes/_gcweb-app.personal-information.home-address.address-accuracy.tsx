import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.address-accuracy.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.address-accuracy.page-title' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0013',
  pageTitleI18nKey: 'personal-information:home-address.address-accuracy.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  if (!session.has('newHomeAddress')) return redirect('/');
  const newHomeAddress = await session.get('newHomeAddress');

  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  return json({ newHomeAddress, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);
  return redirect('/personal-information/home-address/confirm');
}

export default function PersonalInformationHomeAddressAccuracy() {
  const { newHomeAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:home-address.address-accuracy.subtitle')}</p>
      <Form method="post">
        <p className="mb-4">{t('personal-information:home-address.address-accuracy.invalid-address-info')}</p>
        <p>{t('personal-information:home-address.address-accuracy.note')}</p>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-medium">{t('personal-information:home-address.address-accuracy.requested-change')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {newHomeAddress ? (
                <Address
                  address={newHomeAddress.address}
                  city={newHomeAddress.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === newHomeAddress.province)?.provinceTerritoryStateId}
                  postalZipCode={newHomeAddress.postalCode}
                  country={countryList.find((country) => country.countryId === newHomeAddress.country)?.[i18n.language === 'fr' ? 'nameFrench' : 'nameEnglish'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
        </dl>
        <div className="my-4 flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:home-address.address-accuracy.continue')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/">
            {t('personal-information:home-address.address-accuracy.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" to="/personal-information/home-address/edit">
            {t('personal-information:home-address.address-accuracy.re-enter-address')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}

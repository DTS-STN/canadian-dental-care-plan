import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: 'CDCP-0005',
  pageTitleI18nKey: 'personal-information:mailing-address.confirm.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return getTitleMetaTags(t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.confirm.page-title') }));
});

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const mailingAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const newMailingAddress = session.get('newMailingAddress');

  return json({ mailingAddressInfo, newMailingAddress, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  await getAddressService().updateAddressInfo(userId, userInfo?.mailingAddress ?? '', session.get('newMailingAddress'));

  // TODO remove new mailing address from session and handle case when it is missing
  return redirectWithSuccess('/personal-information', 'personal-information:mailing-address.confirm.updated-notification');
}

export default function PersonalInformationMailingAddressConfirm() {
  const { mailingAddressInfo, newMailingAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('personal-information:mailing-address.confirm.subtitle')}</p>
      <Form method="post" noValidate>
        <dl className="my-6 divide-y border-y">
          {mailingAddressInfo && (
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
              <dt className="font-semibold">{t('personal-information:mailing-address.confirm.previous-mailing-address')}</dt>
              <dd className="mt-3 sm:col-span-2 sm:mt-0">
                <Address
                  address={mailingAddressInfo.address}
                  city={mailingAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === mailingAddressInfo.province)?.provinceTerritoryStateId}
                  postalZipCode={mailingAddressInfo.postalCode}
                  country={countryList.find((country) => country.countryId === mailingAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              </dd>
            </div>
          )}
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:mailing-address.confirm.new-mailing-address')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              <Address
                address={newMailingAddress.address}
                city={newMailingAddress.city}
                provinceState={regionList.find((region) => region.provinceTerritoryStateId === newMailingAddress.province)?.provinceTerritoryStateId}
                postalZipCode={newMailingAddress.postalCode}
                country={countryList.find((country) => country.countryId === newMailingAddress.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
              />
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:mailing-address.confirm.button.confirm')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/mailing-address/edit">
            {t('personal-information:mailing-address.confirm.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}

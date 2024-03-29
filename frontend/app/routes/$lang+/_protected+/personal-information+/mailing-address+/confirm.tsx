import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getAddressService } from '~/services/address-service.server';
import { getAuditService } from '~/services/audit-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.confirm.breadcrumbs.address-change-confirm' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.mailingAddressConfirm,
  pageTitleI18nKey: 'personal-information:mailing-address.confirm.page-title',
};

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
  const mailingAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const newMailingAddress = session.get('newMailingAddress');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.confirm.page-title') }) };

  return json({ countryList, mailingAddressInfo, meta, newMailingAddress, regionList });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  await getAddressService().updateAddressInfo(userId, userInfo?.mailingAddress ?? '', session.get('newMailingAddress'));

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.mailing-address', { userId: idToken.sub });

  const locale = getLocale(request);

  // TODO remove new mailing address from session and handle case when it is missing
  return redirectWithSuccess(`/${locale}/personal-information`, 'personal-information:mailing-address.confirm.updated-notification');
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
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === mailingAddressInfo.province)?.abbr}
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
                provinceState={regionList.find((region) => region.provinceTerritoryStateId === newMailingAddress.province)?.abbr}
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

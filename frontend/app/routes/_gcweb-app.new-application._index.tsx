import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

import { useTranslation } from 'react-i18next';

import { getAddressService } from '~/services/address-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('new-application');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'new-application:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0015',
  pageTitleI18nKey: 'new-application:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const preferredLanguage = userInfo.preferredLanguage && (await getLookupService().getPreferredLanguage(userInfo?.preferredLanguage));
  const homeAddressInfo = userInfo.homeAddress && (await getAddressService().getAddressInfo(userId, userInfo?.homeAddress));
  const mailingAddressInfo = userInfo.mailingAddress && (await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress));

  return json({ user: userInfo, preferredLanguage, homeAddressInfo, mailingAddressInfo, countryList, regionList });
}

export default function NewApplicationIndex() {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('new-application:index.subtitle')}</p>
    </>
  );
}

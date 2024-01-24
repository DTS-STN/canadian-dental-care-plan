import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number');

export const handle = {
  i18nNamespaces,
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function PhoneNumberSuccess() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('update-phone-number:success.title')}
      </h1>
      <p>{t('update-phone-number:success.success-message')}</p>
      <div>
        <dl>
          <dt>{t('update-phone-number:component.phone')}</dt>
          <dd>{loaderData.userInfo?.phoneNumber}</dd>
        </dl>
      </div>
      <div>
        <Link id="successPhoneButton" to="/personal-information" className="btn btn-primary btn-lg">
          {t('update-phone-number:success.return')}
        </Link>
      </div>
    </>
  );
}

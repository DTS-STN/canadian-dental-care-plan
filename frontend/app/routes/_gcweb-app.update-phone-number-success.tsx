import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { PhoneNumber } from '~/components/phone-number';
import { userService } from '~/services/user-service.server';
import { useTranslation } from 'react-i18next';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-phone-number');

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function UpdatePhoneNumberSuccess() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces)

  return (
    <>
      <h1 id="wb-cont" property="name">
      {t('update-phone-number:success.title')}
      </h1>
      <p>{t('update-phone-number:success.success-message')}</p>
      <div className="form-group">
        <PhoneNumber phoneNumber={loaderData.userInfo?.phoneNumber} />
      </div>
      <div className="form-group">
        <Link id="successPhoneButton" to="/update-info" className="btn btn-primary btn-lg">
        {t('update-phone-number:success.return')}
        </Link>
      </div>
    </>
  );
}

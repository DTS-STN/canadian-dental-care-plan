import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-info');

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function UpdateInfo() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('update-info:update.title')}
      </h1>
      <p>{t('update-info:update.update-message')}</p>
      <div>
        <dl>
          <dt>{t('update-info:update.phone-number')}</dt>
          <dd>{loaderData.userInfo.phoneNumber}</dd>
        </dl>
      </div>
      <div>
        <Link id="editPhoneButton" to="/personal-information/phone-number/edit" className="btn btn-primary btn-lg">
          {t('update-info:update.button.edit')}
        </Link>
      </div>
    </>
  );
}

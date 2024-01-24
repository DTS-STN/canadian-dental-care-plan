import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:address.success.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:address.success.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:address.success.breadcrumbs.address-change-success' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0009',
  pageTitleI18nKey: 'personal-information:success.page-title',
};
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function UpdateAddressSuccess() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:address.success.page-title')}
      </h1>
      <p>{t('personal-information:address.success.success-message')}</p>

      <div className="row mrgn-tp-sm">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:address.success.home-address')}</h3>
            </header>
            <div className="panel-body">
              <p>{loaderData.userInfo?.homeAddress}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="row mrgn-tp-sm">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">{t('personal-information:address.success.mailing-address')}</h3>
            </header>
            <div className="panel-body">
              <p>{loaderData.userInfo?.mailingAddress}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="form-group">
        <Link id="successPhoneButton" to="/personal-information" className="btn btn-primary btn-lg">
          {t('personal-information:address.success.button.return')}
        </Link>
      </div>
    </>
  );
}

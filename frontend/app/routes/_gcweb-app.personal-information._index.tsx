import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ user: userInfo });
}

export default function PersonalInformationIndex() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  const languageName = user?.preferredLanguage === 'fr' ? t('personal-information:index.french-language-name') : t('personal-information:index.english-language-name');
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:index.page-title')}
      </h1>
      <p>{t('personal-information:index.on-file')}</p>
      <div className="row">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.first-name')}
              </h2>
            </header>
            <div className="panel-body">{user?.firstName}</div>
          </section>
        </div>
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.last-name')}
              </h2>
            </header>
            <div className="panel-body">{user?.lastName}</div>
          </section>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.home-address')}
              </h2>
            </header>
            <div className="panel-body">{user?.homeAddress}</div>
            <footer className="panel-footer">
              <Link id="change-home-address-button" className="btn btn-primary" to="/personal-information/address/edit">
                {t('personal-information:index.change')}
              </Link>
            </footer>
          </section>
        </div>
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.mailing-address')}
              </h2>
            </header>
            <div className="panel-body">{user?.mailingAddress}</div>
            <footer className="panel-footer">
              <Link id="change-mailing-address-button" className="btn btn-primary" to="/personal-information/address/edit">
                {t('personal-information:index.change')}
              </Link>
            </footer>
          </section>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.preferred-language')}
              </h2>
            </header>
            <div className="panel-body">{languageName}</div>
            <footer className="panel-footer">
              <Link id="change-preferred-language-button" className="btn btn-primary" to="/personal-information/preferred-language/edit">
                {t('personal-information:index.change')}
              </Link>
            </footer>
          </section>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className="glyphicon glyphicon-envelope pull-right" aria-hidden="true"></span>
                {t('personal-information:index.phone-number')}
              </h2>
            </header>
            <div className="panel-body">{user?.phoneNumber}</div>
            <footer className="panel-footer">
              <Link id="change-phone-number-button" className="btn btn-primary" to="/personal-information/phone-number/edit">
                {t('personal-information:index.change')}
              </Link>
            </footer>
          </section>
        </div>
      </div>
    </>
  );
}

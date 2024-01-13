import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';

import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces: Namespace = ['gcweb'];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const t = await getFixedT(request, i18nNamespaces);

  return json<LoaderFunctionData>(
    {
      i18nNamespaces,
      pageIdentifier: 'CDCP-0404',
      pageTitle: t('gcweb:not-found.page-title'),
    },
    { status: 404 },
  );
};

export default function () {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <>
      <h1>
        <span>{t('gcweb:not-found.page-header')}</span> <small className="help-inline">{t('gcweb:not-found.page-subheader')}</small>
      </h1>
      <p>{t('gcweb:not-found.page-message')}</p>
      <ul>
        <li>
          <Trans i18nKey="gcweb:not-found.page-link" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

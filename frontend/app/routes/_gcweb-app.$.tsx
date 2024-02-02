import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { PageTitle } from '~/components/page-title';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = {
  documentTitleI18nKey: 'gcweb:not-found.document-title',
  i18nNamespaces,
  pageIdentifier: 'CDCP-0404',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  return json(null, { status: 404 });
}

export default function NotFound() {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <>
      <PageTitle>
        <span>{t('gcweb:not-found.page-title')}</span> <small className="help-inline">{t('gcweb:not-found.page-subtitle')}</small>
      </PageTitle>
      <p>{t('gcweb:not-found.page-message')}</p>
      <ul>
        <li>
          <Trans ns={i18nNamespaces} i18nKey="gcweb:not-found.page-link" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const t = await getFixedT(request, i18nNamespaces);

  return json(
    {
      i18nNamespaces,
      pageIdentifier: 'CDCP-0404',
      pageTitle: t('gcweb:not-found.page-title'),
    } as const satisfies LoaderFunctionData,
    { status: 404 },
  );
};

export default function NotFound() {
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
          <Trans ns={i18nNamespaces} i18nKey="gcweb:not-found.page-link" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

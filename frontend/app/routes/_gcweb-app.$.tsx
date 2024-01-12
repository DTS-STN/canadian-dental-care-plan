import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { type RouteHandle } from '~/types';
import { getFixedT } from '~/utils/locale-utils.server';
import { type PageTitleDataSchema } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: ['gcweb'],
  pageId: 'CDCP-0404',
} satisfies RouteHandle;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const t = await getFixedT(request, ['gcweb']);

  const data: PageTitleDataSchema = {
    pageTitle: t('gcweb:not-found.page-title'),
  };

  return json(data, { status: 404 });
};

export default function () {
  const { t } = useTranslation(['gcweb']);

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
          <Trans ns={['gcweb']} i18nKey="gcweb:not-found.page-link" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

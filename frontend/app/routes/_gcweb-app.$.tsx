import { json } from '@remix-run/node';

import { Trans, useTranslation } from 'react-i18next';

import { InlineLink } from '~/components/inline-link';
import { PageTitle } from '~/components/page-title';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export const handle = {
  documentTitleI18nKey: 'gcweb:not-found.document-title',
  i18nNamespaces,
  pageIdentifier: 'CDCP-0404',
} as const satisfies RouteHandleData;

export async function loader() {
  return json(null, { status: 404 });
}

export default function NotFound() {
  const { t } = useTranslation(i18nNamespaces);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <InlineLink to="/" />;

  return (
    <>
      <PageTitle>
        {t('gcweb:not-found.page-title')}
        &#32;<small className="block text-2xl font-normal text-neutral-500">{t('gcweb:not-found.page-subtitle')}</small>
      </PageTitle>
      <p className="mb-8 text-lg text-gray-500">{t('gcweb:not-found.page-message')}</p>
      <ul className="list-disc space-y-2 pl-10">
        <li>
          <Trans ns={i18nNamespaces} i18nKey="gcweb:not-found.page-link" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

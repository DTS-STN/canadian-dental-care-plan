import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('view-letters');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'view-letters:index.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'view-letters:index.page-title', to: '/view-letters' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'view-letters:index.page-title',
} as const satisfies RouteHandleData;

// TODO Refactor the loader to fetch pdf using service
export async function loader({ request }: LoaderFunctionArgs) {
  const filePath = '/test.pdf';
  return json({ filePath });
}

type LoaderData = {
  filePath: string;
};

export default function ViewLetter() {
  const { referenceId } = useParams();
  const { filePath } = useLoaderData<LoaderData>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p>Reference ID: {referenceId}</p>
      <a href={filePath} download={`${referenceId}.pdf`}>
        <button type="button" className="btn btn-primary btn-sm">
          {t('view-letters:view.download')}
        </button>
      </a>
      <iframe src={filePath} title="Test PDF" className="mt-4 h-screen w-full" />
    </>
  );
}

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('view-letters');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'view-letters:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'view-letters:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'view-letters:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  /**
   * @url Create a new URL object from request URL
   * @sort This accesses the URL's search parameter and retrieves the value associated with the 'sort' parameter, allows the client to specify how the data should be sorted via the URL
   */
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || 'DESC';

  // TODO replace with actual data
  const letters = [
    { id: '112029', subject: 'Letter subject text 1', dateSent: '2022-07-20', referenceId: '898815' },
    { id: '014095', subject: 'Letter subject text 2', dateSent: '2023-04-22', referenceId: '443526' },
    { id: '428715', subject: 'Letter subject text 3', dateSent: '2022-08-21', referenceId: '803445' },
    { id: '780806', subject: 'Letter subject text 4', dateSent: '2022-02-14', referenceId: '445545' },
    { id: '762502', subject: 'Letter subject text 5', dateSent: '2023-05-14', referenceId: '746995' },
    { id: '295592', subject: 'Letter subject text 6', dateSent: '2022-05-04', referenceId: '766722' },
    { id: '284742', subject: 'Letter subject text 7', dateSent: '2022-06-23', referenceId: '978920' },
    { id: '157691', subject: 'Letter subject text 8', dateSent: '2022-04-15', referenceId: '547667' },
    { id: '816041', subject: 'Letter subject text 9', dateSent: '2023-07-07', referenceId: '726700' },
    { id: '538967', subject: 'Letter subject text 10', dateSent: '2023-03-11', referenceId: '624957' },
  ];

  letters.sort((a, b) => {
    return sort === 'ASC' ? new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime() : new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime();
  });
  return json({ letters });
}

export default function ViewLetters() {
  const { letters } = useLoaderData<typeof loader>();
  return (
    <>
      <LetterList letters={letters} />
    </>
  );
}

interface Letter {
  id: string;
  subject: string;
  dateSent: string;
  referenceId: string;
}

interface LetterListProps {
  letters: Letter[];
}

function LetterList({ letters }: LetterListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <div>
      <label htmlFor="sortOrder" className="text-sm">
        <strong>{t('view-letters:index.filter')}</strong>
      </label>
      <select id="sortOrder" onChange={(e) => navigate(`?sort=${e.target.value}`)} className="text-sm">
        <option value="DESC">{t('view-letters:index.newest')}</option>
        <option value="ASC">{t('view-letters:index.oldest')}</option>
      </select>
      <div className="mt-2 border-l border-r border-t">
        <div className="grid grid-cols-3 divide-x divide-gray-300 bg-gray-100 md:grid-cols-[3fr_1fr_1fr]">
          <strong className="border-b border-gray-300 px-4">{t('view-letters:index.subject')}</strong>
          <strong className="border-b border-gray-300 px-4">{t('view-letters:index.date-sent')}</strong>
          <strong className="border-b border-gray-300 px-4">{t('view-letters:index.reference-id')}</strong>
        </div>
        <ul>
          {letters.map((letter) => (
            <li key={letter.id} className="grid grid-cols-3 divide-x divide-gray-300 md:grid-cols-[3fr_1fr_1fr]">
              <span className="border-b border-gray-300 px-4">
                <a href={`/letters/${letter.id}/download`}>{letter.subject}</a>
              </span>
              <span className="border-b border-gray-300 px-4">{new Date(letter.dateSent).toLocaleDateString()}</span>
              <span className="border-b border-gray-300 px-4">{letter.referenceId}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

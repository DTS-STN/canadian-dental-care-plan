import type { ChangeEvent } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';

import { sort } from 'moderndash';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('letters');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'letters:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'letters:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'letters:index.page-title',
} as const satisfies RouteHandleData;

const orderEnumSchema = z.enum(['asc', 'desc']);

export async function loader({ request }: LoaderFunctionArgs) {
  /**
   * @url Create a new URL object from request URL
   * @sort This accesses the URL's search parameter and retrieves the value associated with the 'sort' parameter, allows the client to specify how the data should be sorted via the URL
   */
  const url = new URL(request.url);
  const sortOrder = orderEnumSchema.catch('desc').parse(url.searchParams.get('sort'));

  // TODO replace with actual data
  const letters = [
    { id: '112029', subject: 'Letter subject text 1', dateSent: '2022-07-20T03:04:05.000Z', referenceId: '898815' },
    { id: '014095', subject: 'Letter subject text 2', dateSent: '2023-04-22T03:04:05.000Z', referenceId: '443526' },
    { id: '428715', subject: 'Letter subject text 3', dateSent: '2022-08-21T03:04:05.000Z', referenceId: '803445' },
    { id: '780806', subject: 'Letter subject text 4', dateSent: '2022-02-14T03:04:05.000Z', referenceId: '445545' },
    { id: '762502', subject: 'Letter subject text 5', dateSent: '2023-05-14T03:04:05.000Z', referenceId: '746995' },
    { id: '295592', subject: 'Letter subject text 6', dateSent: '2022-05-04T03:04:05.000Z', referenceId: '766722' },
    { id: '284742', subject: 'Letter subject text 7', dateSent: '2022-06-23T03:04:05.000Z', referenceId: '978920' },
    { id: '157691', subject: 'Letter subject text 8', dateSent: '2022-04-15T03:04:05.000Z', referenceId: '547667' },
    { id: '816041', subject: 'Letter subject text 9', dateSent: '2023-07-07T03:04:05.000Z', referenceId: '726700' },
    { id: '538967', subject: 'Letter subject text 10', dateSent: '2023-03-11T03:04:05.000Z', referenceId: '624957' },
  ];

  const sortedLetters = sort(letters, { order: sortOrder, by: (item) => item.dateSent });

  return json({ letters: sortedLetters, sortOrder });
}

export default function LettersIndex() {
  const [, setSearchParams] = useSearchParams();
  const { t } = useTranslation(i18nNamespaces);
  const { letters, sortOrder } = useLoaderData<typeof loader>();

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  return (
    <div>
      <label htmlFor="sort-order" className="text-sm">
        <strong>{t('letters:index.filter')}</strong>
      </label>
      <select id="sort-order" value={sortOrder} onChange={handleOnSortOrderChange} className="text-sm">
        <option value={orderEnumSchema.enum.desc}>{t('letters:index.newest')}</option>
        <option value={orderEnumSchema.enum.asc}>{t('letters:index.oldest')}</option>
      </select>
      <div className="mt-2 border-l border-r border-t">
        <div className="grid grid-cols-3 divide-x divide-gray-300 bg-gray-100 md:grid-cols-[3fr_1fr_1fr]">
          <strong className="border-b border-gray-300 px-4">{t('letters:index.subject')}</strong>
          <strong className="border-b border-gray-300 px-4">{t('letters:index.date-sent')}</strong>
          <strong className="border-b border-gray-300 px-4">{t('letters:index.reference-id')}</strong>
        </div>
        <ul>
          {letters.map((letter) => (
            <li key={letter.id} className="grid grid-cols-3 divide-x divide-gray-300 md:grid-cols-[3fr_1fr_1fr]">
              <span className="border-b border-gray-300 px-4">
                <Link to={`/letters/${letter.id}/download`}>{letter.subject}</Link>
              </span>
              <span className="border-b border-gray-300 px-4">{letter.dateSent}</span>
              <span className="border-b border-gray-300 px-4">{letter.referenceId}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

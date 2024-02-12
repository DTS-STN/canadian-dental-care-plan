import { type ChangeEvent, useEffect, useState } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { getLettersService } from '~/services/letters-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('letters');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'letters:index.page-title' }],
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

  const userService = await getUserService();
  const letterService = await getLettersService();
  const userId = await userService.getUserId();
  const letters = await letterService.getLetters(userId, sortOrder);

  return json({ letters: letters, sortOrder });
}

export default function LettersIndex() {
  const [, setSearchParams] = useSearchParams();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const { letters, sortOrder } = useLoaderData<typeof loader>();
  const [dateTimeFormat, setDateTimeFormat] = useState<Intl.DateTimeFormat | undefined>();

  useEffect(() => {
    setDateTimeFormat(new Intl.DateTimeFormat(`${i18n.language}-CA`));
  }, [i18n.language]);

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  function getFormattedDate(date: string | undefined) {
    if (!date || !dateTimeFormat) {
      return date;
    }
    return dateTimeFormat.format(new Date(date));
  }

  return (
    <div>
      <label htmlFor="sort-order" className="block w-fit text-base font-medium">
        <strong>{t('letters:index.filter')}</strong>
      </label>
      <select id="sort-order" value={sortOrder} onChange={handleOnSortOrderChange} className="block rounded border p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-blue-500">
        <option value={orderEnumSchema.enum.desc}>{t('letters:index.newest')}</option>
        <option value={orderEnumSchema.enum.asc}>{t('letters:index.oldest')}</option>
      </select>
      <ul className="mt-2 divide-y rounded-md border">
        {letters.map((letter) => (
          <li key={letter.id} className="space-y-1 px-4 py-2 hover:bg-gray-100">
            <Link reloadDocument to={`/letters/${letter.referenceId}/download`} className="text-base font-bold no-underline">
              {i18n.language === 'en' ? letter.nameEn : letter.nameFr}
            </Link>
            <div className="text-sm">{t('letters:index.date', { date: getFormattedDate(letter.dateSent) })}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

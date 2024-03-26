import type { ChangeEvent } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { InputSelect } from '~/components/input-select';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLettersService } from '~/services/letters-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { IdToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'letters:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('letters', 'gcweb'),
  pageIdentifier: pageIds.protected.letters.index,
  pageTitleI18nKey: 'letters:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

const orderEnumSchema = z.enum(['asc', 'desc']);

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  if (!featureEnabled('view-letters')) {
    throw new Response('Not Found', { status: 404 });
  }

  const auditService = getAuditService();
  const instrumentationService = getInstrumentationService();
  const lettersService = getLettersService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const sortParam = new URL(request.url).searchParams.get('sort');
  const sortOrder = orderEnumSchema.catch('desc').parse(sortParam);
  const userId = await userService.getUserId();
  const letters = await lettersService.getLetters(userId, 'clientId', sortOrder); // TODO where and what is clientId?
  const letterTypes = (await lettersService.getAllLetterTypes()).filter(({ id }) => letters.some(({ name }) => name === id));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('letters:index.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  auditService.audit('page-view.letters', { userId: idToken.sub });
  instrumentationService.countHttpStatus('letters.view', 200);

  return json({ letters, letterTypes, meta, sortOrder });
}

export default function LettersIndex() {
  const [, setSearchParams] = useSearchParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { letters, letterTypes, sortOrder } = useLoaderData<typeof loader>();

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('letters:index.subtitle')}</p>
      <div className="my-6">
        <InputSelect
          id="sort-order"
          value={sortOrder}
          onChange={handleOnSortOrderChange}
          label={t('letters:index.filter')}
          name="sortOrder"
          options={[
            { value: orderEnumSchema.enum.desc, children: t('letters:index.newest') },
            { value: orderEnumSchema.enum.asc, children: t('letters:index.oldest') },
          ]}
        />
      </div>
      <ul className="divide-y border-y">
        {letters.map((letter) => {
          const letterType = letterTypes.find(({ id }) => id === letter.name);
          const translatedLetterName = letterType ? getNameByLanguage(i18n.language, letterType) : letter.name;
          const letterName = translatedLetterName ?? letter.name;

          return (
            <li key={letter.id} className="py-4 sm:py-6">
              <InlineLink reloadDocument to={`/letters/${letter.referenceId}/download`} className="external-link font-lato font-semibold" target="_blank">
                {letterName}
              </InlineLink>
              <p className="mt-1 text-sm text-gray-500">{t('letters:index.date', { date: letter.issuedOn })}</p>
            </li>
          );
        })}
      </ul>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/home">
          {t('letters:index.button.back')}
        </ButtonLink>
      </div>
    </>
  );
}

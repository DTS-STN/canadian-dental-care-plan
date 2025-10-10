import type { ChangeEvent } from 'react';

import { redirect, useSearchParams } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import type { Option } from 'oxide.ts';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { InputSelect } from '~/components/input-select';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'letters:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('letters', 'gcweb'),
  pageIdentifier: pageIds.protected.letters.index,
  pageTitleI18nKey: 'letters:index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

const orderEnumSchema = z.enum(['asc', 'desc']);

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('view-letters');
  await securityHandler.validateAuthSession({ request, session });

  const sortParam = new URL(request.url).searchParams.get('sort');
  const sortOrder = orderEnumSchema.catch('desc').parse(sortParam);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const clientNumberOption: Option<string> = session.has('clientNumber')
    ? session.find('clientNumber')
    : await appContainer.get(TYPES.ApplicantService).findClientNumberBySin({
        sin: userInfoToken.sin,
        userId: userInfoToken.sub,
      });

  if (clientNumberOption.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientNumber = clientNumberOption.unwrap();
  const allLetters = await appContainer.get(TYPES.LetterService).findLettersByClientId({ clientId: clientNumber, userId: userInfoToken.sub, sortOrder });
  const letterTypes = await appContainer.get(TYPES.LetterTypeService).listLetterTypes();
  const letters = allLetters.filter(({ letterTypeId }) => letterTypes.some(({ id }) => letterTypeId === id));

  session.set('clientNumber', clientNumber);
  session.set('letters', letters);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('letters:index.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.letters', { userId: idToken.sub });

  return { letters, letterTypes, meta, sortOrder, SCCH_BASE_URI };
}

export default function LettersIndex({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const [, setSearchParams] = useSearchParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { letters, letterTypes, sortOrder, SCCH_BASE_URI } = loaderData;

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  return (
    <>
      {letters.length === 0 ? (
        <ContextualAlert type="info">
          <p>{t('letters:index.no-letter')}</p>
        </ContextualAlert>
      ) : (
        <>
          <div className="my-6">
            <InputSelect
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
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
              const letterType = letterTypes.find(({ id }) => id === letter.letterTypeId);
              const gcAnalyticsCustomClickValue = `ESDC-EDSC:CDCP Letters Click:${letterType?.nameEn ?? letter.letterTypeId}`;
              const letterName = letterType ? getNameByLanguage(currentLanguage, letterType) : letter.letterTypeId;

              return (
                <li key={letter.id} className="py-4 sm:py-6">
                  <InlineLink reloadDocument routeId="protected/letters/$id.download" params={{ ...params, id: letter.id }} className="external-link" newTabIndicator target="_blank" data-gc-analytics-customclick={gcAnalyticsCustomClickValue}>
                    {letterName}
                  </InlineLink>
                  <p className="mt-1 text-sm text-gray-500">{t('letters:index.date', { date: letter.date })}</p>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="my-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('letters:index.button.back')}
        </ButtonLink>
      </div>
    </>
  );
}

import { useEffect } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams } from '@remix-run/react';

import { randomUUID } from 'crypto';

import pageIds from '../../page-ids.json';
import { startApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.index,
  pageTitleI18nKey: 'apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, serviceProvider, session }, request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const id = randomUUID().toString();
  const state = startApplyState({ id, session });

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:index.page-title') }) };

  return json({ id: state.id, locale, meta });
}

export default function ApplyIndex() {
  const { id } = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();

  const path = getPathById('public/apply/$id/terms-and-conditions', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('flow.state', 'active');
    navigate(path, { replace: true });
  }, [navigate, path]);

  return (
    <div className="max-w-prose animate-pulse">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-full rounded bg-gray-200"></div>
          <div className="h-5 w-full rounded bg-gray-200"></div>
          <div className="h-5 w-2/3 rounded bg-gray-200"></div>
        </div>
        <div className="h-5 w-1/2 rounded bg-gray-200"></div>
        <div className="h-5 w-1/2 rounded bg-gray-200"></div>
      </div>
      <div className="my-8 space-y-2">
        <div className="h-5 w-full rounded bg-gray-200"></div>
        <div className="h-5 w-2/3 rounded bg-gray-200"></div>
      </div>
      <div className="h-10 w-2/5 rounded bg-gray-200"></div>
    </div>
  );
}

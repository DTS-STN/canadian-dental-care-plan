import { useEffect } from 'react';

import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';

import { randomUUID } from 'crypto';

import pageIds from '../../page-ids.json';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.index,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const id = randomUUID().toString();
  const sessionResponseInit = await applyRouteHelpers.start({ id, request, session });

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:index.page-title') }) };

  return json({ id, locale, meta }, sessionResponseInit);
}

export default function ApplyIndex() {
  const { id, locale } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('flow.state', 'active');
    navigate(`/${locale}/apply/${id}/terms-and-conditions`, { replace: true });
  }, [id, locale, navigate]);

  return <></>;
}

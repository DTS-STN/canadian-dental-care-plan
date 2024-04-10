import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';

import pageIds from '../page-ids.json';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('gcweb'),
  pageIdentifier: pageIds.public.unableToProcessRequest,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: 'Unable to process CDCP requests' }) };

  return json({ meta });
}

export default function UnableToProcessRequest() {
  return (
    <PublicLayout>
      <div className="mb-8 space-y-4">
        <p>You may not proceed with the application.</p>
      </div>
    </PublicLayout>
  );
}

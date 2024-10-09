import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';

import { useTranslation } from 'react-i18next';

import { PublicLayout } from '~/components/layouts/public-layout';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('address-validation', 'gcweb'),
  pageTitleI18nKey: 'address-validation:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request }: LoaderFunctionArgs) {
  featureEnabled('address-validation');
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('address-validation:page-title') }) };
  return { meta };
}

export function action({ request }: ActionFunctionArgs) {
  featureEnabled('address-validation');
  if (request.method !== 'POST') {
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }
}

export default function AddressValidationRoute() {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <PublicLayout>
      <p>{t('address-validation:description')}</p>
    </PublicLayout>
  );
}

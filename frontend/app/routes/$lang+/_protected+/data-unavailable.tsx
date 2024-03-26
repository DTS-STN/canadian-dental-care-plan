import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'data-unavailable:page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('data-unavailable', 'gcweb'),
  pageIdentifier: pageIds.protected.dataUnavailable,
  pageTitleI18nKey: 'data-unavailable:page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('data-unavailable:page-title') }) };

  return json({ meta });
}

export default function DataUnavailable() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const userOrigin = useUserOrigin();

  const doyouqualify = <InlineLink to={t('do-you-qualify.href')} />;
  const howtoapply = <InlineLink to={t('how-to-apply.href')} />;
  const contactus = <InlineLink to={t('contact-us.href')} />;
  const statuschecker = <InlineLink to={t('status-checker.href')} />;

  return (
    <>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="service-eligible" components={{ doyouqualify }} />
        <Trans ns={handle.i18nNamespaces} i18nKey="more-information" components={{ howtoapply }} />
      </p>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="other-enquiry" components={{ contactus }} />
      </p>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="service-delay" components={{ statuschecker }} />
      </p>

      {userOrigin && (
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin.to}>
            {t('back-button')}
          </ButtonLink>
        </div>
      )}
    </>
  );
}

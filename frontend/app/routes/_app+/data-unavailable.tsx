import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('data-unavailable');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'data-unavailable:page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0099',
  pageTitleI18nKey: 'data-unavailable:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const { SCCH_BASE_URI } = getClientEnv();

  return json({ SCCH_BASE_URI });
}

export default function DataUnavailable() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const doyouqualify = <InlineLink to={t('do-you-qualify.href')} />;
  const howtoapply = <InlineLink to={t('how-to-apply.href')} />;
  const contactus = <InlineLink to={t('contact-us.href', { baseUri: SCCH_BASE_URI })} />;
  const mydashboard = <InlineLink to={t('my-dashboard.href', { baseUri: SCCH_BASE_URI })} />;

  return (
    <>
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="service-eligible" components={{ doyouqualify }} />
      </p>
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="more-information" components={{ howtoapply }} />
      </p>
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="other-enquiry" components={{ contactus }} />
      </p>
      <p className="mb-8">{t('service-delay')}</p>

      <Trans ns={i18nNamespaces} i18nKey="my-dashboard" components={{ mydashboard }} />
    </>
  );
}

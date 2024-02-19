import type { ReactNode } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InlineLink } from '~/components/inline-link';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getClientEnv } from '~/utils/env-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('data-unavailable', 'gcweb');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'data-unavailable:page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0099',
  pageTitleI18nKey: 'data-unavailable:page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return '';
}

export default function DataUnavailable() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();
  return (
    <>
      <p>{t('service-unavailable')}</p>
      <InlineLink to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-dashboard.text')}</InlineLink>
    </>
  );
}

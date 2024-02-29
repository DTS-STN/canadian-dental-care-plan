import { Suspense, useContext } from 'react';

import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useRouteLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { getToast } from 'remix-toast';

import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import SessionTimeout from '~/components/session-timeout';
import { Toaster } from '~/components/toaster';
import fontLatoStyleSheet from '~/fonts/lato.css';
import fontNotoSansStyleSheet from '~/fonts/noto-sans.css';
import { getBuildInfoService } from '~/services/build-info-service.server';
import tailwindStyleSheet from '~/tailwind.css';
import { getPublicEnv } from '~/utils/env.server';
import type { FeatureName } from '~/utils/env.server';
import { useDocumentTitleI18nKey, useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';
import { useCanonicalURL } from '~/utils/seo-utils';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontLatoStyleSheet },
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: tailwindStyleSheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const buildInfoService = getBuildInfoService();
  const { toast, headers } = await getToast(request);
  const requestUrl = new URL(request.url);

  return json(
    {
      buildInfo: buildInfoService.getBuildInfo(),
      env: getPublicEnv(),
      origin: requestUrl.origin,
      toast,
    },
    { headers },
  );
}

export default function App() {
  const { nonce } = useContext(NonceContext);
  const { env, origin, toast } = useLoaderData<typeof loader>();
  const ns = useI18nNamespaces();
  const { i18n } = useTranslation(ns);
  const documentTitle = useDocumentTitle();
  const canonicalURL = useCanonicalURL(origin);

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{documentTitle}</title>
        <Meta />
        <link rel="canonical" href={canonicalURL} />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Suspense>
          <Outlet />
          <Toaster toast={toast} />
          <SessionTimeout promptBeforeIdle={env.SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={env.SESSION_TIMEOUT_SECONDS * 1000} />
        </Suspense>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <ClientEnv env={env} nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

/**
 * Return true if a given feature is enabled.
 */
export function useFeature(feature: FeatureName) {
  // since this hook can be called from any route,
  // we must explicitly specify which loader to use
  const loaderData = useRouteLoaderData<typeof loader>('root');
  return loaderData?.env.ENABLED_FEATURES.includes(feature);
}

/**
 * Get the translated document title based on internationalization keys,
 * or undefined if no key is provided.
 *
 * This hook initializes the translation function and retrieves
 * internationalization keys for the document title and page title. It returns
 * the translated document title or undefined if no key is provided.
 */
function useDocumentTitle() {
  const ns = useI18nNamespaces();
  const { t } = useTranslation(ns);
  const documentTitleI18nKey = useDocumentTitleI18nKey();
  const pageTitleI18nKey = usePageTitleI18nKey();
  const i18nKey = documentTitleI18nKey ?? pageTitleI18nKey;
  return i18nKey && (t(i18nKey) as string); // as string otherwise it's typeof any
}

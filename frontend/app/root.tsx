import { Suspense, useContext } from 'react';

import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
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
import { useI18nNamespaces } from '~/utils/route-utils';
import { useAlternateLanguages, useCanonicalURL } from '~/utils/seo-utils';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontLatoStyleSheet },
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: tailwindStyleSheet },
];

export const meta: MetaFunction<typeof loader> = (args) => {
  return [{ name: 'robots', content: 'noindex' }];
};

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
  const canonicalURL = useCanonicalURL(origin);
  const alternateLanguages = useAlternateLanguages(origin);

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link rel="canonical" href={canonicalURL} />
        {alternateLanguages.map(({ href, hrefLang }) => (
          <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
        ))}
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

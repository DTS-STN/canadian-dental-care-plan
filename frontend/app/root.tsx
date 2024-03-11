import { Suspense, useContext } from 'react';

import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Links, LiveReload, Meta, MetaFunction, Outlet, Scripts, ScrollRestoration, useLoaderData, useRouteLoaderData } from '@remix-run/react';

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
import { getDescriptionMetaTags, getTitleMetaTags, useAlternateLanguages, useCanonicalURL } from '~/utils/seo-utils';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontLatoStyleSheet },
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: tailwindStyleSheet },
];

export const meta: MetaFunction = (args) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ns = useI18nNamespaces();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { i18n, t } = useTranslation(ns);
  const author = t('gcweb:meta.author');
  const description = t('gcweb:meta.description');
  const language = i18n.language === 'fr' ? 'fra' : 'eng';
  const locale = `${i18n.language}_CA`;
  const siteName = t('gcweb:meta.site-name');
  const subject = t('gcweb:meta.subject');
  const title = t('gcweb:meta.title.default');
  return [
    ...getTitleMetaTags(title),
    ...getDescriptionMetaTags(description),
    { name: 'author', content: author },
    { name: 'dcterms.accessRights', content: '2' },
    { name: 'dcterms.creator', content: author },
    { name: 'dcterms.language', content: language },
    { name: 'dcterms.service', content: 'ESDC-EDSC_CDCP-RCSD' },
    { name: 'dcterms.spatial', content: 'Canada' },
    { name: 'dcterms.subject', content: subject },
    { name: 'robots', content: 'noindex' },
    { property: 'og:locale', content: locale },
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: 'website' },
  ];
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

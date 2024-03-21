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
import { getSessionService } from '~/services/session-service.server';
import tailwindStyleSheet from '~/tailwind.css';
import { getPublicEnv } from '~/utils/env.server';
import type { FeatureName } from '~/utils/env.server';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { useI18nNamespaces } from '~/utils/route-utils';
import { getDescriptionMetaTags, getTitleMetaTags, useAlternateLanguages, useCanonicalURL } from '~/utils/seo-utils';
import { getUserOrigin } from '~/utils/user-origin-utils.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontLatoStyleSheet },
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: tailwindStyleSheet },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  return [
    ...getTitleMetaTags(data.meta.title),
    ...getDescriptionMetaTags(data.meta.description),
    { name: 'author', content: data.meta.author },
    { name: 'dcterms.accessRights', content: '2' },
    { name: 'dcterms.creator', content: data.meta.author },
    { name: 'dcterms.language', content: data.meta.language },
    { name: 'dcterms.service', content: 'ESDC-EDSC_CDCP-RCSD' },
    { name: 'dcterms.spatial', content: 'Canada' },
    { name: 'dcterms.subject', content: data.meta.subject },
    { name: 'robots', content: 'noindex' },
    { property: 'og:locale', content: data.meta.locale },
    { property: 'og:site_name', content: data.meta.siteName },
    { property: 'og:type', content: 'website' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const buildInfoService = getBuildInfoService();
  const { toast, headers: toastHeaders } = await getToast(request);
  const requestUrl = new URL(request.url);
  const locale = await getLocale(request);
  const t = await getFixedT(request, ['gcweb']);

  const buildInfo = buildInfoService.getBuildInfo();
  const env = getPublicEnv();
  const meta = {
    author: t('gcweb:meta.author'),
    description: t('gcweb:meta.description'),
    language: locale === 'fr' ? 'fra' : 'eng',
    locale: `${locale}_CA`,
    siteName: t('gcweb:meta.site-name'),
    subject: t('gcweb:meta.subject'),
    title: t('gcweb:meta.title.default'),
  };
  const origin = requestUrl.origin;

  const userOrigin = await getUserOrigin(request);
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  session.set('userOrigin', userOrigin);

  return json({ buildInfo, env, meta, origin, toast, userOrigin }, { headers: { ...toastHeaders, 'Set-Cookie': await sessionService.commitSession(session) } });
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

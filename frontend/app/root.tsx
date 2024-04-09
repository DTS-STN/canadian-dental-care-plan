import { Suspense, useContext, useEffect } from 'react';

import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation, useRouteLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import reactPhoneNumberInputStyleSheet from 'react-phone-number-input/style.css';
import { getToast } from 'remix-toast';

import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import { Toaster } from '~/components/toaster';
import fontLatoStyleSheet from '~/fonts/lato.css';
import fontNotoSansStyleSheet from '~/fonts/noto-sans.css';
import { getBuildInfoService } from '~/services/build-info-service.server';
import tailwindStyleSheet from '~/tailwind.css';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import type { FeatureName } from '~/utils/env.server';
import { getPublicEnv } from '~/utils/env.server';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { useI18nNamespaces } from '~/utils/route-utils';
import { getDescriptionMetaTags, getTitleMetaTags, useAlternateLanguages, useCanonicalURL } from '~/utils/seo-utils';
import { getUserOrigin } from '~/utils/user-origin-utils.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontLatoStyleSheet },
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: reactPhoneNumberInputStyleSheet },
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

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const buildInfoService = getBuildInfoService();
  const { toast, headers: toastHeaders } = await getToast(request);
  const requestUrl = new URL(request.url);
  const locale = getLocale(request);
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

  const userOrigin = await getUserOrigin(request, session);
  session.set('userOrigin', userOrigin);

  return json({ buildInfo, env, meta, origin, toast, userOrigin }, { headers: { ...toastHeaders } });
}

export default function App() {
  const { nonce } = useContext(NonceContext);
  const { env, origin, toast } = useLoaderData<typeof loader>();
  const location = useLocation();
  const ns = useI18nNamespaces();
  const { i18n } = useTranslation(ns);
  const canonicalURL = useCanonicalURL(origin);
  const alternateLanguages = useAlternateLanguages(origin);

  useEffect(() => {
    if (env.ADOBE_ANALYTICS_SRC && env.ADOBE_ANALYTICS_JQUERY_SRC) {
      adobeAnalytics.pageview(location.pathname);
    }
  }, [env.ADOBE_ANALYTICS_JQUERY_SRC, env.ADOBE_ANALYTICS_SRC, location.pathname]);

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
        {env.ADOBE_ANALYTICS_SRC && env.ADOBE_ANALYTICS_JQUERY_SRC && (
          <>
            <script src={env.ADOBE_ANALYTICS_JQUERY_SRC} nonce={nonce} suppressHydrationWarning />
            <script src={env.ADOBE_ANALYTICS_SRC} nonce={nonce} suppressHydrationWarning />
          </>
        )}
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Suspense>
          <Outlet />
          <Toaster toast={toast} />
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

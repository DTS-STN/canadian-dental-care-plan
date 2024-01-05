import { useContext } from 'react';

import { Link, Links, LiveReload, Meta, Scripts, ScrollRestoration } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';

export default function NotFound() {
  const { nonce } = useContext(NonceContext);
  const { i18n, t } = useTranslation(['common']);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>{t('errors.not-found.page-title')}</title>
      </head>
      <body>
        <h1>{t('errors.not-found.page-header')}</h1>
        <p>{t('errors.not-found.page-message')}</p>
        <ul>
          <li>
            <Trans i18nKey="errors.not-found.page-link" components={{ home }} />
          </li>
        </ul>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

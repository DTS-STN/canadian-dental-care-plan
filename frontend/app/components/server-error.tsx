import { useContext } from 'react';

import { Link, Links, LiveReload, Meta, Scripts, ScrollRestoration, useRouteError } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { NonceContext } from '~/components/nonce-context';

export default function ServerError() {
  const { nonce } = useContext(NonceContext);
  const { i18n, t } = useTranslation(['common']);

  // (for documentation/example)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const error = useRouteError();

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
        <title>{t('errors.server-error.page-title')}</title>
      </head>
      <body>
        <h1>{t('errors.server-error.page-header')}</h1>
        <h2>{t('errors.server-error.page-subheader')}</h2>
        <p>{t('errors.server-error.page-message')}</p>
        <ul>
          <li>{t('errors.server-error.option-01')}</li>
          <li>
            <Trans i18nKey="errors.server-error.option-02" components={{ home }} />
          </li>
        </ul>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

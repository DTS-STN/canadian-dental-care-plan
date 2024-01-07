import { Link, useRouteError } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

export default function ServerError() {
  const { t } = useTranslation();

  // (for documentation/example)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const error = useRouteError();

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <>
      <h1>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        <span>{t('gcweb.server-error.page-header')}</span> <small className="help-inline">{t('gcweb.server-error.page-subheader')}</small>
      </h1>
      <p>{t('gcweb.server-error.page-message')}</p>
      <ul className="list-disc ps-16">
        <li>{t('gcweb.server-error.option-01')}</li>
        <li>
          <Trans i18nKey="gcweb.server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </>
  );
}

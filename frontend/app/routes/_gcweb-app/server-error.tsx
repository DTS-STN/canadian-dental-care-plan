import { Link } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { ApplicationLayout } from './application-layout';

export function ServerError({ error }: { error: unknown }) {
  const { t } = useTranslation(['gcweb']);

  // (content will be added by <Trans>)
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  const home = <Link to="/" />;

  return (
    <ApplicationLayout>
      <h1>
        <span className="glyphicon glyphicon-warning-sign mrgn-rght-md"></span>
        <span>{t('gcweb.server-error.page-header')}</span> <small className="help-inline">{t('gcweb.server-error.page-subheader')}</small>
      </h1>
      <p>{t('gcweb.server-error.page-message')}</p>
      <ul className="list-disc ps-16">
        <li>{t('gcweb.server-error.option-01')}</li>
        <li>
          <Trans ns={['gcweb']} i18nKey="gcweb.server-error.option-02" components={{ home }} />
        </li>
      </ul>
    </ApplicationLayout>
  );
}

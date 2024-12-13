import { useTranslation } from 'react-i18next';

import { getClientEnv } from '~/utils/env-utils';
import { usePageIdentifier } from '~/utils/route-utils';

export function PageDetails() {
  const { t } = useTranslation(['gcweb']);
  const { BUILD_DATE: buildDate, BUILD_VERSION: buildVersion } = getClientEnv();

  const pageIdentifier = usePageIdentifier();

  return (
    <section className="mb-8 mt-16">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1">
        {!!pageIdentifier && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.screen-id')}</dt>
            <dd>
              <span property="identifier">{pageIdentifier}</span>
            </dd>
          </div>
        )}
        {!!buildDate && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.date-modfied')}</dt>
            <dd>
              <time property="dateModified">{buildDate.slice(0, 10)}</time>
            </dd>
          </div>
        )}
        {!!buildVersion && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.version')}</dt>
            <dd>
              <span property="version">{buildVersion}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

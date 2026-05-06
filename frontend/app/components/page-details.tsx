import { useTranslation } from 'react-i18next';

import { useBuildInfo, usePageIdentifier } from '~/utils/route-utils';

export function PageDetails() {
  const { t } = useTranslation('gcweb');

  const buildInfo = useBuildInfo() ?? {
    buildDate: '2000-01-01T00:00:00Z',
    buildVersion: '0.0.0',
  };

  const pageIdentifier = usePageIdentifier();

  return (
    <section className="mt-16 mb-8">
      <h2 className="sr-only">{t(($) => $.pageDetails.pageDetails)}</h2>
      <dl id="wb-dtmd" className="space-y-1">
        {!!pageIdentifier && (
          <div className="flex gap-2">
            <dt>{t(($) => $.pageDetails.screenId)}</dt>
            <dd>
              <span property="identifier">{pageIdentifier}</span>
            </dd>
          </div>
        )}
        {!!buildInfo.buildDate && (
          <div className="flex gap-2">
            <dt>{t(($) => $.pageDetails.dateModfied)}</dt>
            <dd>
              <time property="dateModified">{buildInfo.buildDate.slice(0, 10)}</time>
            </dd>
          </div>
        )}
        {!!buildInfo.buildVersion && (
          <div className="flex gap-2">
            <dt>{t(($) => $.pageDetails.version)}</dt>
            <dd>
              <span property="version">{buildInfo.buildVersion}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

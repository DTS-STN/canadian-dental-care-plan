import { useMatches } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { useBuildInfo } from '~/utils/build-info';

export function PageDetails() {
  const buildInfo = useBuildInfo();

  type PageDetailsAttrs = { pageId?: string };
  const pageDetailsAttrs = useMatches().map((match) => match.data as PageDetailsAttrs);

  const dateModified = buildInfo?.buildDate;
  const pageId = pageDetailsAttrs.map((attr) => attr?.pageId).reduce((last, curr) => curr ?? last);
  const version = buildInfo?.buildVersion;

  const { t } = useTranslation(['gcweb']);

  return (
    <section className="pagedetails">
      <h2 className="wb-inv">{t('gcweb.page-details.page-details')}</h2>
      <div className="row">
        <div className="col-xs-12">
          <dl id="wb-dtmd">
            {!!pageId && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.screen-id')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="identifier">{pageId}</span>
                </dd>
              </>
            )}
            {!!dateModified && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.date-modfied')}</dt>
                <dd className="float-left clear-right mb-0">
                  <time property="dateModified">{dateModified.slice(0, 10)}</time>
                </dd>
              </>
            )}
            {!!version && (
              <>
                <dt className="float-left clear-left pr-[1ch]">{t('gcweb.page-details.version')}</dt>
                <dd className="float-left clear-right mb-0">
                  <span property="version">{version}</span>
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}

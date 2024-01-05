import { useTranslation } from 'react-i18next';

export type PageDetailsProps = { dateModified: string };

export default function PageDetails({ dateModified }: PageDetailsProps) {
  const { t } = useTranslation(['gcweb']);

  return (
    <section className="pagedetails">
      <h2 className="wb-inv">{t('gcweb.page-details.page-details')}</h2>
      <div className="row">
        <div className="col-xs-12">
          <dl id="wb-dtmd">
            <dt className="pr-[1ch]">{t('gcweb.page-details.date-modfied')}</dt>
            <dd>
              <time property="dateModified">{dateModified}</time>
            </dd>
          </dl>
        </div>
      </div>
    </section>
  );
}

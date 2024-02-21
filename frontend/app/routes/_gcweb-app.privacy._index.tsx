import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('privacy');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'privacy:privacy-statement.title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00015',
} as const satisfies RouteHandleData;

export default function Privacy() {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:privacy-statement.title')}</h2>
        <p className="mb-4">{t('privacy:privacy-statement.content1')}</p>
        <p className="mb-4">{t('privacy:privacy-statement.content2')}</p>
        <p>{t('privacy:privacy-statement.content3')}</p>
        <a className="text-[#0535D2]" href={t('privacy:privacy-statement.privacy-policy-link')}>
          {t('privacy:privacy-statement.privacy-policy-link-text')}
        </a>
        <p className="mt-4">{t('privacy:privacy-statement.content4')}</p>
        <a className="text-[#0535D2]" href={t('privacy:privacy-statement.report-a-concern')}>
          {t('privacy:privacy-statement.report-a-concern')}.
        </a>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:identity-information.title')}</h2>
        <p>{t('privacy:identity-information.content1')}</p>
        <ul className="list-disc pl-8">
          <li>{t('privacy:identity-information.list-item1')}</li>
          <li>{t('privacy:identity-information.list-item2')}</li>
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:terms-and-conditions.title')}</h2>
        <p>{t('privacy:terms-and-conditions.content')}</p>
      </section>
      <section className="my-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:apply.title')}</h2>
        <p>{t('privacy:apply.content')}</p>
      </section>
      <ButtonLink size="base" variant="green" className="rounded-sm" to="/application">
        {t('privacy:button.start-app')}
      </ButtonLink>
    </>
  );
}

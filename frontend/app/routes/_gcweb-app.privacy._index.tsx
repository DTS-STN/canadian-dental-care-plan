import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('privacy');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'privacy:privacy-statement-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00015',
} as const satisfies RouteHandleData;

export default function Privacy() {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:privacy-statement-title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy:privacy-statement-content') }} />
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:identity-info-title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy:identity-info-content') }} />
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:terms-title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy:terms-content') }} />
      </section>
      <section className="my-8">
        <h2 className="mb-4 text-lg font-bold">{t('privacy:apply-title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy:apply-content') }} />
      </section>
      <ButtonLink size="base" variant="green" className="rounded-sm" to="/application">
        {t('privacy:button.start-app')}
      </ButtonLink>
    </>
  );
}

import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('new-application');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'new-application:privacy-statement.breadcrumbs.new-application' }, { labelI18nKey: 'new-application:privacy-statement.breadcrumbs.privacy-statement' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0015',
  pageTitleI18nKey: 'new-application:privacy-statement.page-title',
} as const satisfies RouteHandleData;

export default function NewApplicationIndex() {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p className="mb-8 text-lg font-bold">{t('new-application:privacy-statement.privacy-statement.subtitle')}</p>
      <p className="mb-4">{t('new-application:privacy-statement.privacy-statement.paragraph-one')}</p>
      <p className="mb-4">{t('new-application:privacy-statement.privacy-statement.paragraph-two')}</p>
      <p className="mb-4">{t('new-application:privacy-statement.privacy-statement.paragraph-three')}</p>
      <p className="mb-8">{t('new-application:privacy-statement.privacy-statement.paragraph-four')}</p>

      <p className="mb-8 text-lg font-bold">{t('new-application:privacy-statement.identity-information.subtitle')}</p>
      <p>{t('new-application:privacy-statement.identity-information.paragraph-one')}</p>
      <ul className="mb-4 list-disc pl-10">
        <li>{t('new-application:privacy-statement.identity-information.listitem-one')}</li>
        <li>{t('new-application:privacy-statement.identity-information.listitem-two')}</li>
      </ul>
      <p className="mb-4">{t('new-application:privacy-statement.identity-information.paragraph-two')}</p>
      <p className="mb-8">{t('new-application:privacy-statement.identity-information.paragraph-three')}</p>
      <p className="mb-8 text-lg font-bold">{t('new-application:privacy-statement.terms-and-conditions.subtitle')}</p>
      <p className="mb-8">{t('new-application:privacy-statement.terms-and-conditions.paragraph-one')}</p>
      <p className="mb-8 text-lg font-bold">{t('new-application:privacy-statement.apply-now.subtitle')}</p>
      <p className="mb-4">{t('new-application:privacy-statement.apply-now.paragraph-one')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink className="bg-green-800 text-white" id="apply-button" to="/new-application/a2">
          {t('new-application:privacy-statement.apply-now.button')}
        </ButtonLink>
      </div>
    </>
  );
}

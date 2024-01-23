import { useTranslation } from 'react-i18next';

import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('update-info');

export default function UpdateInfoSuccess() {
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('update-info:success.title')}
      </h1>
      <p>{t('update-info:success.success-message')}</p>
    </>
  );
}

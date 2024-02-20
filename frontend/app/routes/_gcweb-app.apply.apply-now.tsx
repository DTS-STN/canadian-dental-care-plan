import type { LoaderFunctionArgs } from '@remix-run/node';

import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('intake-forms');

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return '';
}

export default function ApplyNow() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.privacy-statement')}</p>
      <p>{t('intake-forms:apply-form.privacy-message')}</p>
      <p />
      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.identity-information')}</p>
      <p>{t('intake-forms:apply-form.identity-message')}</p>
      <p />
      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.terms-and-conditions')}</p>
      <p>{t('intake-forms:apply-form.terms-and-conditions-message')}</p>
      <p />
      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.apply-now')}</p>
      <p>{t('intake-forms:apply-form.start-note')}</p>

      <ButtonLink id="apply-now-button" to="/personal-information">
        {t('intake-forms:apply-form.start-application')}
      </ButtonLink>
    </>
  );
}

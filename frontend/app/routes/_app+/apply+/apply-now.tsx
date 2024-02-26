import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('intake-forms');
export const handle = {
  breadcrumbs: [{ labelI18nKey: 'intake-forms:apply-form.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-1111',
  pageTitleI18nKey: 'intake-forms:apply-form.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return json({ ok: true });
}

export default function ApplyNow() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.privacy-statement')}</p>
      <p>{t('intake-forms:apply-form.privacy-message')}</p>

      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.identity-information')}</p>
      <p>{t('intake-forms:apply-form.identity-message')}</p>

      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.terms-and-conditions')}</p>
      <p>{t('intake-forms:apply-form.terms-and-conditions-message')}</p>

      <p className="mb-8 text-lg text-gray-500">{t('intake-forms:apply-form.apply-now')}</p>
      <p>{t('intake-forms:apply-form.start-note')}</p>

      <ButtonLink id="apply-now-button" to="/apply/application-type">
        {t('intake-forms:apply-form.start-application')}
      </ButtonLink>
    </>
  );
}

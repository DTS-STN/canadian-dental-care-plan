import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('eligibility');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  return json({ id });
}

export default function ApplyFlowFileYourTaxes() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  const taxInfo = <InlineLink to={t('file-your-taxes.tax-info-href')} />;

  return (
    <div className="mt-6">
      <p className="mb-6">{t('file-your-taxes.ineligible-to-apply')}</p>
      <p className="mb-6">{t('file-your-taxes.tax-not-filed')}</p>
      <p className="mb-6">{t('file-your-taxes.unable-to-assess')}</p>
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="file-your-taxes.tax-info" components={{ taxInfo }} />
      </p>
      <p className="mb-6">{t('file-your-taxes.apply-after')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" variant="alternative" to={`/apply/${id}/tax-filing`}>
          {t('file-your-taxes.back-btn')}
          <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" to="/">
          {t('file-your-taxes.return-btn')}
        </ButtonLink>
      </div>
    </div>
  );
}

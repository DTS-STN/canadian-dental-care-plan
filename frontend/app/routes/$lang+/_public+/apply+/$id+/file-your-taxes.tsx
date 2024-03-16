import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.fileYourTaxes,
  pageTitleI18nKey: 'apply:eligibility.file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.file-your-taxes.page-title') }) };

  return json({ id, meta });
}

export default function ApplyFlowFileYourTaxes() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);
  const navigation = useNavigation();

  const taxInfo = <InlineLink to={t('apply:eligibility.file-your-taxes.tax-info-href')} />;

  return (
    <div className="mt-6">
      <p className="mb-6">{t('apply:eligibility.file-your-taxes.ineligible-to-apply')}</p>
      <p className="mb-6">{t('apply:eligibility.file-your-taxes.tax-not-filed')}</p>
      <p className="mb-6">{t('apply:eligibility.file-your-taxes.unable-to-assess')}</p>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.file-your-taxes.tax-info" components={{ taxInfo }} />
      </p>
      <p className="mb-6">{t('apply:eligibility.file-your-taxes.apply-after')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" to={`/apply/${id}/tax-filing`} className={cn(navigation.state !== 'idle' && 'pointer-events-none')}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:eligibility.file-your-taxes.back-btn')}
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" to="/" onClick={() => sessionStorage.removeItem('flow.state')}>
          {t('apply:eligibility.file-your-taxes.return-btn')}
          {navigation.state !== 'idle' && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </ButtonLink>
      </div>
    </div>
  );
}

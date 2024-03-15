import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

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
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:eligibility.dob-eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.dob-eligibility.page-title') }) };

  return json({ id, meta });
}

export default function ApplyFlowFileYourTaxes() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);
  const navigation = useNavigation();

  const eligibilityInfo = <InlineLink to={t('apply:eligibility.dob-eligibility.eligibility-info-href')} />;

  return (
    <div className="mt-6">
      <p className="mb-6">{t('apply:eligibility.dob-eligibility.ineligible-to-apply')}</p>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.dob-eligibility.eligibility-info" components={{ eligibilityInfo }} />
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" to={`/apply/${id}/date-of-birth`} className={cn(navigation.state !== 'idle' && 'pointer-events-none')}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:eligibility.dob-eligibility.back-btn')}
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" to="/" onClick={() => sessionStorage.removeItem('flow.state')}>
          {t('apply:eligibility.dob-eligibility.return-btn')}
          {navigation.state !== 'idle' && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </ButtonLink>
      </div>
    </div>
  );
}

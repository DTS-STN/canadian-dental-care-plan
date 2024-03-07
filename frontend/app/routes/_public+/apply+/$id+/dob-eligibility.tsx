import { LoaderFunctionArgs, json } from '@remix-run/node';
import { MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('eligibility', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:dob-eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('eligibility:dob-eligibility.page-title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  return json({ id });
}

export default function ApplyFlowFileYourTaxes() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);

  const eligibilityInfo = <InlineLink to={t('dob-eligibility.eligibility-info-href')} />;

  return (
    <div className="mt-6">
      <p className="mb-6">{t('dob-eligibility.ineligible-to-apply')}</p>
      <p className="mb-6">
        <Trans ns={handle.i18nNamespaces} i18nKey="dob-eligibility.eligibility-info" components={{ eligibilityInfo }} />
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" variant="alternative" to={`/apply/${id}/date-of-birth`}>
          {t('dob-eligibility.back-btn')}
          <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" to="/">
          {t('dob-eligibility.return-btn')}
        </ButtonLink>
      </div>
    </div>
  );
}

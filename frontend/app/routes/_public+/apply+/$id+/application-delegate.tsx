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
  pageTitleI18nKey: 'eligibility:application-delegate.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  return json({ id });
}

export default function ApplyFlowApplicationDelegate() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  const contactServiceCanada = <InlineLink to={t('application-delegate.contact-service-canada-href')} />;
  const preparingToApply = <InlineLink to={t('application-delegate.preparing-to-apply-href')} />;
  const span = <span className="whiteSpace-nowrap" />;

  return (
    <div className="mt-6">
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="application-delegate.contact-representative" components={{ contactServiceCanada, span }} />
      </p>
      <p className="mb-6">
        <Trans ns={i18nNamespaces} i18nKey="application-delegate.prepare-to-apply" components={{ preparingToApply }} />
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" variant="alternative" to={`/apply/${id}/type-of-application`}>
          {t('application-delegate.back-btn')}
          <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" to="/">
          {t('application-delegate.return-btn')}
        </ButtonLink>
      </div>
    </div>
  );
}

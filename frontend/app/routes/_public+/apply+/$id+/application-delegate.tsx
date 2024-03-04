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
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'eligibility:breadcrumbs.canada-ca', to: '/personal-information' },
    { labelI18nKey: 'eligibility:breadcrumbs.benefits' },
    { labelI18nKey: 'eligibility:breadcrumbs.dental-coverage' },
    { labelI18nKey: 'eligibility:breadcrumbs.canadian-dental-care-plan' },
  ],
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

  const contactservicecanada = <InlineLink to={t('application-delegate.contact-service-canada-href')} />;
  const preparingtoapply = <InlineLink to={t('application-delegate.preparing-to-apply-href')} />;

  return (
    <>
      <br />
      <div className="max-w-prose">
        <p>
          <Trans ns={i18nNamespaces} i18nKey="application-delegate.description1" components={{ contactservicecanada }} />
        </p>
        <br />
        <p>
          <Trans ns={i18nNamespaces} i18nKey="application-delegate.description2" components={{ preparingtoapply }} />
        </p>
        <br />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={'/apply/' + id + '/type-of-application'}>
            {t('back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </ButtonLink>
          <ButtonLink type="submit" variant="primary" to="/">
            {t('return-btn')}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}

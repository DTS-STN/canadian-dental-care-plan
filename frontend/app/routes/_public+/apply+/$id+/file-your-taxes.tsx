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

  const taxinfo = <InlineLink to={t('file-your-taxes.tax-info-href')} />;

  return (
    <>
      <br />
      <div className="max-w-prose">
        <p>{t('file-your-taxes.description1')}</p>
        <br />
        <p>{t('file-your-taxes.description2')}</p>
        <br />
        <p>{t('file-your-taxes.description3')}</p>
        <br />
        <p>
          <Trans ns={i18nNamespaces} i18nKey="file-your-taxes.description4" components={{ taxinfo }} />
        </p>
        <br />
        <p>{t('file-your-taxes.description5')}</p>
        <br />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={'/apply/' + id + '/tax-filing'}>
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

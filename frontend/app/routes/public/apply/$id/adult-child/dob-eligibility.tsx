import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useFetcher, useParams } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { clearApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.dateOfBirthEligibility,
  pageTitleI18nKey: 'apply-adult-child:eligibility.dob-eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadApplyAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.dob-eligibility.page-title') }) };

  return { id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  loadApplyAdultChildState({ params, request, session });
  clearApplyState({ params, session });
  return redirect(t('apply-adult-child:eligibility.dob-eligibility.return-btn-link'));
}

export default function ApplyFlowDobEligibility() {
  const { t } = useTranslation(handle.i18nNamespaces);

  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const eligibilityInfo = <InlineLink to={t('apply-adult-child:eligibility.dob-eligibility.eligibility-info-href')} className="external-link" newTabIndicator target="_blank" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('apply-adult-child:eligibility.dob-eligibility.ineligible-to-apply')}</p>
        <p>{t('apply-adult-child:eligibility.dob-eligibility.currently-accepting')}</p>
        <p>{t('apply-adult-child:eligibility.dob-eligibility.later-date')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:eligibility.dob-eligibility.eligibility-info" components={{ eligibilityInfo }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          type="button"
          routeId="public/apply/$id/adult-child/disability-tax-credit"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Find out when you can apply click"
        >
          {t('apply-adult-child:eligibility.dob-eligibility.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Find out when you can apply click">
          {t('apply-adult-child:eligibility.dob-eligibility.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

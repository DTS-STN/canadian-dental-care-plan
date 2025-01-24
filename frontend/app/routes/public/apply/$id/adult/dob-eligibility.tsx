import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/dob-eligibility';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.dateOfBirthEligibility,
  pageTitleI18nKey: 'apply-adult:eligibility.dob-eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const { id } = loadApplyAdultState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:eligibility.dob-eligibility.page-title') }) };

  return { id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  loadApplyAdultState({ params, request, session });
  clearApplyState({ params, session });
  return redirect(t('apply-adult:eligibility.dob-eligibility.return-btn-link'));
}

export default function ApplyFlowDobEligibility({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const eligibilityInfo = <InlineLink to={t('apply-adult:eligibility.dob-eligibility.eligibility-info-href')} className="external-link" newTabIndicator target="_blank" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('apply-adult:eligibility.dob-eligibility.ineligible-to-apply')}</p>
        <p>{t('apply-adult:eligibility.dob-eligibility.currently-accepting')}</p>
        <p>{t('apply-adult:eligibility.dob-eligibility.later-date')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:eligibility.dob-eligibility.eligibility-info" components={{ eligibilityInfo }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          type="button"
          routeId="public/apply/$id/adult/disability-tax-credit"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Find out when you can apply click"
        >
          {t('apply-adult:eligibility.dob-eligibility.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Find out when you can apply click">
          {t('apply-adult:eligibility.dob-eligibility.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

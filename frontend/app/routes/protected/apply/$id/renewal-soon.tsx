import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/renewal-soon';

import { TYPES } from '~/.server/constants';
import { clearProtectedApplyState, loadProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.renewalSoon,
  pageTitleI18nKey: 'protected-apply:renewal-soon.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadProtectedApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:renewal-soon.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  loadProtectedApplyState({ params, session });
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplyState({ params, session });

  return redirect(t('renewal-soon.exit-link'));
}

export default function ProtectedApplyFlowRenewalSoon({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>
          <Trans ns={['protected-apply']} i18nKey="protected-apply:renewal-soon.able-to-renew" components={{ cdcpLink: <InlineLink to={t('protected-apply:renewal-soon.able-to-renew-link')} className="external-link" newTabIndicator target="_blank" /> }} />
        </p>
        <p>{t('protected-apply:renewal-soon.get-ready')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>{t('protected-apply:renewal-soon.file-tax-return')}</li>
          <li>{t('protected-apply:renewal-soon.spouse-or-common-do-same')}</li>
          <li>{t('protected-apply:renewal-soon.wait-notice-assessment')}</li>
        </ul>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          variant="secondary"
          routeId="protected/apply/$id/new-or-returning"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Back - Renewal soon click"
        >
          {t('protected-apply:renewal-soon.back-btn')}
        </ButtonLink>
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Exit - Renewal soon click">
          {t('protected-apply:renewal-soon.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

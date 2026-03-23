import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/renewal-submitted';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.renewalSubmitted,
  pageTitleI18nKey: 'protected-application-spokes:renewal-submitted.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:renewal-submitted.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  return redirect(t('protected-application-spokes:renewal-submitted.exit-btn-link'));
}

export default function RenewalApplicationSubmitted({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const noWrap = <span className="whitespace-nowrap" />;
  const statusCheckerLink = <InlineLink routeId="public/status/index" className="external-link" newTabIndicator target="_blank" params={params} />;
  const mscaLinkAccount = <InlineLink to={t('protected-application-spokes:renewal-submitted.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>{t('protected-application-spokes:renewal-submitted.records-show-application-submitted')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:renewal-submitted.status-checker-info" components={{ statusCheckerLink }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:renewal-submitted.update-profile-info" components={{ mscaLinkAccount, noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Exit - Renewal application submitted click">
          {t('protected-application-spokes:renewal-submitted.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

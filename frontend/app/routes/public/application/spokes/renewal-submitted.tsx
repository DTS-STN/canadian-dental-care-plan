import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/renewal-submitted';

import { TYPES } from '~/.server/constants';
import { clearPublicApplicationState, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
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
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.renewalSubmitted,
  pageTitleI18nKey: 'application-spokes:renewalSubmitted.pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  getPublicApplicationState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:renewalSubmitted.pageTitle') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  getPublicApplicationState({ params, session });

  const formData = await request.formData();
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t('application-spokes:renewalSubmitted.exitBtnLink'));
}

export default function RenewalApplicationSubmitted({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const noWrap = <span className="whitespace-nowrap" />;
  const statusCheckerLink = <InlineLink routeId="public/status/index" className="external-link" newTabIndicator target="_blank" params={params} />;
  const mscaLinkAccount = <InlineLink to={t('application-spokes:renewalSubmitted.mscaLinkAccount')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>{t('application-spokes:renewalSubmitted.recordsShowApplicationSubmitted')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:renewalSubmitted.statusCheckerInfo" components={{ statusCheckerLink }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:renewalSubmitted.updateProfileInfo" components={{ mscaLinkAccount, noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          variant="secondary"
          type="button"
          routeId="public/application/$id/personal-information"
          params={params}
          disabled={isSubmitting}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Back - Renewal application submitted click"
        >
          {t('application-spokes:renewalSubmitted.backBtn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Exit - Renewal application submitted click">
          {t('application-spokes:renewalSubmitted.exitBtn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

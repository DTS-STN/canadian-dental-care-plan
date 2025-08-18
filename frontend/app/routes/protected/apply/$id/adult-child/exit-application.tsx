import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/exit-application';

import { TYPES } from '~/.server/constants';
import { clearProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.exitApplication,
  pageTitleI18nKey: 'protected-apply-adult-child:exit-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:exit-application.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.adult-child.exit-application', { userId: idToken.sub });

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplyState({ params, session });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.adult-child.exit-application', { userId: idToken.sub });

  return redirect(t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI }));
}

export default function ApplyFlowTaxFiling({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-apply-adult-child:exit-application.are-you-sure')}</p>
        <p>{t('protected-apply-adult-child:exit-application.click-back')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="protected/apply/$id/adult-child/review-child-information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Exiting the application click"
        >
          {t('protected-apply-adult-child:exit-application.back-btn')}
        </ButtonLink>
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Return to my dashboard - Exiting the application click">
          {t('protected-apply:return-dashboard')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

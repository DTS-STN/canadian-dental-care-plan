import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/cannot-apply-child';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplySingleChildState } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.cannotApplyChild,
  pageTitleI18nKey: 'protected-apply-child:children.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  loadProtectedApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-child:children.cannot-apply-child.page-title') }) };

  instrumentationService.countHttpStatus('protected.apply.child.children.cannot-apply-child', 200);
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  instrumentationService.countHttpStatus('protected.apply.child.children.cannot-apply-child', 302);
  return redirect(getPathById('protected/apply/$id/child/children/index', params));
}

export default function ApplyForYourself({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>{t('protected-apply-child:children.cannot-apply-child.ineligible-to-apply')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:children.cannot-apply-child.eligibility-info" components={{ noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="protected/apply/$id/child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child apply for yourself click"
        >
          {t('protected-apply-child:children.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Proceed - Child apply for yourself click">
          {t('protected-apply-child:children.cannot-apply-child.continue-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

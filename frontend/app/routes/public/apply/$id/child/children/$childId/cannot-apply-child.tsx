import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/cannot-apply-child';

import { TYPES } from '~/.server/constants';
import { loadApplySingleChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { clearApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeRouteModuleMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.cannotApplyChild,
  pageTitleI18nKey: 'apply-child:children.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeRouteModuleMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.cannot-apply-child.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  loadApplySingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearApplyState({ params, session });
  return redirect(t('apply-child:children.cannot-apply-child.return-btn-link'));
}

export default function ApplyForYourself({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>{t('apply-child:children.cannot-apply-child.ineligible-to-apply')}</p>
        <p>{t('apply-child:children.cannot-apply-child.eligibility-info')}</p>
        <p>{t('apply-child:children.cannot-apply-child.eligibility-2025')}</p>
        <p>
          <InlineLink to={t('apply-child:children.cannot-apply-child.when-to-apply-href')} className="external-link" newTabIndicator target="_blank">
            {t('apply-child:children.cannot-apply-child.when-to-apply')}
          </InlineLink>
        </p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/apply/$id/child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child apply for yourself click"
        >
          {t('apply-child:children.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Proceed - Child apply for yourself click">
          {t('apply-child:children.cannot-apply-child.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

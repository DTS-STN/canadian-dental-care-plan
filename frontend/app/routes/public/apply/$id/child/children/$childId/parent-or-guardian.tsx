import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadApplySingleChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { clearApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.childParentOrGuardian,
  pageTitleI18nKey: 'apply-child:children.parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.parent-or-guardian.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  loadApplySingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearApplyState({ params, session });
  return redirect(t('apply-child:children.parent-or-guardian.return-btn-link'));
}

export default function ApplyFlowParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>{t('apply-child:children.parent-or-guardian.must-be')}</p>
        <p>{t('apply-child:children.parent-or-guardian.unable-to-apply')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/apply/$id/child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child parent or guardian needs to apply click"
        >
          {t('apply-child:children.parent-or-guardian.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Exit - Child parent or guardian needs to apply click">
          {t('apply-child:children.parent-or-guardian.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </>
  );
}

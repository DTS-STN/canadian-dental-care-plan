import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadRenewSingleChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.parentOrGuardian,
  pageTitleI18nKey: 'renew-child:children.parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadRenewSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:children.parent-or-guardian.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  loadRenewSingleChildState({ params, request, session });

  return redirect(getPathById('public/renew/$id/child/children/index', params));
}

export default function RenewFlowParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('renew.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>{t('renew-child:children.parent-or-guardian.must-be')}</p>
        <p>{t('renew-child:children.parent-or-guardian.unable-to-apply')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/renew/$id/child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - You must be a parent or legal guardian click"
        >
          {t('renew-child:children.parent-or-guardian.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Return to application - You must be a parent or legal guardian click">
          {t('renew-child:children.parent-or-guardian.continue-btn')}
        </LoadingButton>
      </fetcher.Form>
    </>
  );
}

import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import { clearApplyState, getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.parentOrGuardian,
  pageTitleI18nKey: 'apply-adult:parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:parent-or-guardian.page-title') }) };

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory !== 'children' && ageCategory !== 'youth') {
    return redirect(getPathById('public/apply/$id/adult/date-of-birth', params));
  }

  return { ageCategory, defaultState: state.disabilityTaxCredit, id: state.id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearApplyState({ params, session });
  return redirect(t('apply-adult:parent-or-guardian.return-btn-link'));
}

export default function ApplyFlowParentOrGuardian() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { ageCategory } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const noWrap = <span className="whitespace-nowrap" />;

  function getBackButtonRouteId() {
    if (ageCategory === 'youth') {
      return 'public/apply/$id/adult/living-independently';
    }

    return 'public/apply/$id/adult/date-of-birth';
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 max-w-prose space-y-4">
        <p className="mb-4">{t('apply-adult:parent-or-guardian.unable-to-apply')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:parent-or-guardian.apply-for-yourself" components={{ noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId={getBackButtonRouteId()}
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Parent or guardian needs to apply click"
        >
          {t('apply-adult:parent-or-guardian.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Parent or guardian needs to apply click">
          {t('apply-adult:parent-or-guardian.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </>
  );
}

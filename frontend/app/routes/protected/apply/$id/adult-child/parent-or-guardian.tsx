import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import type { Route } from './+types/parent-or-guardian';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { clearProtectedApplyState, getAgeCategoryFromDateString } from '~/.server/routes/helpers/protected-apply-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.parentOrGuardian,
  pageTitleI18nKey: 'protected-apply-adult-child:parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:parent-or-guardian.page-title') }) };

  invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
  const ageCategory = state.editModeApplicantInformation?.dateOfBirth ? getAgeCategoryFromDateString(state.editModeApplicantInformation.dateOfBirth) : getAgeCategoryFromDateString(state.applicantInformation.dateOfBirth);

  if (ageCategory !== 'children' && ageCategory !== 'youth') {
    return redirect(getPathById('protected/apply/$id/adult-child/applicant-information', params));
  }

  instrumentationService.countHttpStatus('protected.apply.adult-child.parent-or-guardian', 200);
  return { id: state.id, meta, ageCategory };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplyState({ params, session });

  instrumentationService.countHttpStatus('protected.apply.adult-child.parent-or-guardian', 302);
  return redirect(t('protected-apply-adult-child:parent-or-guardian.return-btn-link'));
}

export default function ApplyFlowParentOrGuardian({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { ageCategory } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  function getBackButtonRouteId() {
    if (ageCategory === 'youth') {
      return 'protected/apply/$id/adult-child/living-independently';
    }

    return 'protected/apply/$id/adult-child/applicant-information';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-apply-adult-child:parent-or-guardian.unable-to-apply')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="parent-or-guardian.apply-for-yourself" components={{ noWrap }} />
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
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Parent or legal guardian needs to apply click"
        >
          {t('protected-apply-adult-child:parent-or-guardian.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Exit - Parent or legal guardian needs to apply click">
          {t('protected-apply-adult-child:parent-or-guardian.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

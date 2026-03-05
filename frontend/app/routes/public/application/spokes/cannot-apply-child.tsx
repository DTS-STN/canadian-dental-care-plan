import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/cannot-apply-child';

import { TYPES } from '~/.server/constants';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/base-application-route-helpers';
import { clearPublicApplicationState, getSingleChildState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.cannotApplyChild,
  pageTitleI18nKey: 'application-spokes:children.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const childState = getSingleChildState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:children.cannot-apply-child.page-title') }) };

  invariant(childState.information?.dateOfBirth, 'Child date of birth must be defined');
  const ageCategory = getAgeCategoryFromDateString(childState.information.dateOfBirth);

  // Determines which message to display:
  // - If the applicant is currently a child or youth, show content indicating they will turn 18 by the end of the current coverage.
  // - Otherwise, show content indicating they are not eligible to apply because they are an adult.
  const isChildrenOrYouth = ageCategory === 'children' || ageCategory === 'youth';

  return { isChildrenOrYouth, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t('application-spokes:children.cannot-apply-child.exit-btn-link'));
}

export default function ApplyForYourself({ loaderData, params }: Route.ComponentProps) {
  const { isChildrenOrYouth } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>
          {isChildrenOrYouth //
            ? t(`application-spokes:children.cannot-apply-child.ineligible-to-apply.cutoff-application`)
            : t(`application-spokes:children.cannot-apply-child.ineligible-to-apply.adult-application`)}
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:children.cannot-apply-child.eligibility-info" components={{ noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          variant="secondary"
          routeId="public/application/$id/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Back - Child apply for yourself click"
        >
          {t('application-spokes:children.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Exit - Child apply for yourself click">
          {t('application-spokes:children.cannot-apply-child.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

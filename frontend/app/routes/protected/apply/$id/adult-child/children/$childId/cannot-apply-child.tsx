import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/cannot-apply-child';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState, loadProtectedApplyAdultSingleChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.applySelf,
  pageTitleI18nKey: 'protected-apply-adult-child:eligibility.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  loadProtectedApplyAdultSingleChildState({ params, request, session });
  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const { APPLICATION_CURRENT_DATE } = getEnv();
  const locale = getLocale(request);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:eligibility.cannot-apply-child.page-title') }) };
  const currentDate = APPLICATION_CURRENT_DATE ? parseDateString(APPLICATION_CURRENT_DATE) : new UTCDate();
  const coverageStartDate = parseDateString(state.applicationYear.coverageStartDate);
  const formattedDate = toLocaleDateString(coverageStartDate, locale);

  const isBeforeCoverageStartDate = currentDate < coverageStartDate;

  instrumentationService.countHttpStatus('protected.apply.adult-child.children.cannot-apply-child', 200);
  return { meta, isBeforeCoverageStartDate, coverageStartDate: formattedDate };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  instrumentationService.countHttpStatus('protected.apply.adult-child.children.cannot-apply-child', 302);
  return redirect(getPathById('protected/apply/$id/adult-child/children/index', params));
}

export default function ApplyForYourself({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { coverageStartDate, isBeforeCoverageStartDate } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        {isBeforeCoverageStartDate ? (
          <>
            <p>{t('protected-apply-adult-child:eligibility.cannot-apply-child.before-june.ineligible-to-apply', { coverageStartDate })}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult-child:eligibility.cannot-apply-child.before-june.eligibility-info" components={{ noWrap }} />
            </p>
          </>
        ) : (
          <>
            <p>{t('protected-apply-adult-child:eligibility.cannot-apply-child.after-june.ineligible-to-apply')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult-child:eligibility.cannot-apply-child.after-june.eligibility-info" components={{ noWrap }} />
            </p>
          </>
        )}
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="protected/apply/$id/adult-child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - You cannot apply for your child click"
        >
          {t('protected-apply-adult-child:eligibility.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Proceed - You cannot apply for your child click">
          {t('protected-apply-adult-child:eligibility.cannot-apply-child.proceed-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

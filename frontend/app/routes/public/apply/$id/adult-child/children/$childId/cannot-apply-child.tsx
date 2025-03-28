import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/cannot-apply-child';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState, loadApplyAdultSingleChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.applySelf,
  pageTitleI18nKey: 'apply-adult-child:eligibility.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  loadApplyAdultSingleChildState({ params, request, session });
  const state = loadApplyAdultChildState({ params, request, session });
  const { APPLICATION_YEAR_REQUEST_DATE } = getEnv();
  const locale = getLocale(request);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.cannot-apply-child.page-title') }) };
  const currentDate = APPLICATION_YEAR_REQUEST_DATE ? new Date(APPLICATION_YEAR_REQUEST_DATE) : new Date();
  const coverageStartDate = new UTCDate(state.applicationYear.coverageStartDate);
  const formattedDate = coverageStartDate.toLocaleDateString(`${locale}-CA`, { year: 'numeric', month: 'long', day: 'numeric' });

  const isBeforeCoverageStartDate = currentDate < coverageStartDate;

  return { meta, isBeforeCoverageStartDate, currentYear: formattedDate };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  return redirect(getPathById('public/apply/$id/adult-child/children/index', params));
}

export default function ApplyForYourself({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { currentYear, isBeforeCoverageStartDate } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        {isBeforeCoverageStartDate ? (
          <>
            <p>{t('apply-adult-child:eligibility.cannot-apply-child.before-june.ineligible-to-apply', { currentYear })}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:eligibility.cannot-apply-child.before-june.eligibility-info" components={{ noWrap }} />
            </p>
          </>
        ) : (
          <>
            <p>{t('apply-adult-child:eligibility.cannot-apply-child.after-june.ineligible-to-apply')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:eligibility.cannot-apply-child.after-june.eligibility-info" components={{ noWrap }} />
            </p>
          </>
        )}
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/apply/$id/adult-child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - You cannot apply for your child click"
        >
          {t('apply-adult-child:eligibility.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Proceed - You cannot apply for your child click">
          {t('apply-adult-child:eligibility.cannot-apply-child.proceed-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

import { FormEvent } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('adult-apply', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.dateOfBirthEligibility,
  pageTitleI18nKey: 'adult-apply:eligibility.dob-eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const { id } = await applyRouteHelpers.loadState({ params, request, session });

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('adult-apply:eligibility.dob-eligibility.page-title') }) };

  return json({ id, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/dob-eligibility');
  const applyRouteHelpers = getApplyRouteHelpers();

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  await applyRouteHelpers.loadState({ params, request, session });
  await applyRouteHelpers.clearState({ params, request, session });
  return redirect(getPathById('index', params));
}

export default function ApplyFlowDobEligibility() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const eligibilityInfo = <InlineLink to={t('adult-apply:eligibility.dob-eligibility.eligibility-info-href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('adult-apply:eligibility.dob-eligibility.ineligible-to-apply')}</p>
        <p>{t('adult-apply:eligibility.dob-eligibility.currently-accepting')}</p>
        <p>{t('adult-apply:eligibility.dob-eligibility.later-date')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="adult-apply:eligibility.dob-eligibility.eligibility-info" components={{ eligibilityInfo }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink type="button" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Find out when you can apply click">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('adult-apply:eligibility.dob-eligibility.back-btn')}
        </ButtonLink>
        <ButtonLink
          type="submit"
          variant="primary"
          onClick={() => sessionStorage.removeItem('flow.state')}
          to={t('adult-apply:eligibility.dob-eligibility.return-btn-link')}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Find out when you can apply click"
        >
          {t('adult-apply:eligibility.dob-eligibility.return-btn')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </ButtonLink>
      </fetcher.Form>
    </div>
  );
}

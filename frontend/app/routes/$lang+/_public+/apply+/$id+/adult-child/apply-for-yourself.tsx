import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { saveApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.applySelf,
  pageTitleI18nKey: 'apply-adult-child:eligibility.apply-for-yourself.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.apply-for-yourself.page-title') }) };

  return json({ id: state.id, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/apply-for-yourself');
  const state = loadApplyAdultChildState({ params, request, session });
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: { typeOfApplication: 'adult' } });

  const { taxFiling2023, dateOfBirth } = state.adultChildState;
  saveApplyAdultState({ params, request, session, state: { taxFiling2023, dateOfBirth } });

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
}

export default function ApplyForYourself() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-4">
        <p>
          {t('apply-adult-child:eligibility.apply-for-yourself.ineligible-to-apply')}&nbsp;
          <InlineLink to={t('apply-adult-child:eligibility.apply-for-yourself.eligibility-info-href')}>{t('apply-adult-child:eligibility.apply-for-yourself.eligibility-info')}</InlineLink>
        </p>
        <p>{t('apply-adult-child:eligibility.apply-for-yourself.submit-application')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult-child/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Apply for yourself">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-adult-child:eligibility.apply-for-yourself.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" id="proceed-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Proceed - Apply for yourself click">
          {t('apply-adult-child:eligibility.apply-for-yourself.proceed-btn')}
          <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
        </Button>
      </fetcher.Form>
    </div>
  );
}

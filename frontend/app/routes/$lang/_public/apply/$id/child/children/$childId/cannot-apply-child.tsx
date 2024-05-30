import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import pageIds from '../../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.cannotApplyChild,
  pageTitleI18nKey: 'apply-child:children.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.cannot-apply-child.page-title') }) };

  return json({ id: state.id, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/cannot-apply-child');
  loadApplyChildState({ params, request, session });
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));
  const state = loadApplyChildState({ params, request, session });

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: { editMode: true, typeOfApplication: 'adult' } });

  return redirect(getPathById('$lang/_public/apply/$id/adult/review-information', params));
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
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/child/children/$childId/information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Apply for yourself">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-child:children.cannot-apply-child.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" id="proceed-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Proceed - Apply for yourself click">
          {t('apply-child:children.cannot-apply-child.proceed-btn')}
          <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
        </Button>
      </fetcher.Form>
    </div>
  );
}

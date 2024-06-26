import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { loadApplyAdultSingleChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.parentOrGuardian,
  pageTitleI18nKey: 'apply-adult-child:children.parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  loadApplyAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.parent-or-guardian.page-title') }) };

  return json({ csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/children/parent-or-guardian');

  loadApplyAdultSingleChildState({ params, request, session });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: { typeOfApplication: 'adult' } });

  return redirect(getPathById('$lang/_public/apply/$id/adult/review-information', params));
}

export default function ApplyFlowParentOrGuardian() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>{t('apply-adult-child:children.parent-or-guardian.must-be')}</p>
        <p>{t('apply-adult-child:children.parent-or-guardian.unable-to-apply')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink
          id="back-button"
          routeId="$lang/_public/apply/$id/adult-child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child must be a parent or legal guardian click"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-adult-child:children.parent-or-guardian.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Child must be a parent or legal guardian click">
          {t('apply-adult-child:children.parent-or-guardian.continue-btn')}
          <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
        </Button>
      </fetcher.Form>
    </>
  );
}

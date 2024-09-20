import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { loadApplySingleChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { clearApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.cannotApplyChild,
  pageTitleI18nKey: 'apply-child:children.cannot-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  loadApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:children.cannot-apply-child.page-title') }) };

  return json({ csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/children/cannot-apply-child');
  loadApplySingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  clearApplyState({ params, session });
  return redirect(t('apply-child:children.cannot-apply-child.return-btn-link'));
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
        <ButtonLink
          id="back-button"
          routeId="$lang/_public/apply/$id/child/children/$childId/information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child apply for yourself click"
        >
          {t('apply-child:children.cannot-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Proceed - Child apply for yourself click">
          {t('apply-child:children.cannot-apply-child.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

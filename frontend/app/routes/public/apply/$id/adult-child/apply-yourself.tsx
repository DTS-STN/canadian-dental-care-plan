import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
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
  pageTitleI18nKey: 'apply-adult-child:eligibility.apply-yourself.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:eligibility.apply-yourself.page-title') }) };

  return { id: state.id, csrfToken, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/apply-yourself');
  loadApplyAdultChildState({ params, request, session });
  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));
  const state = loadApplyAdultChildState({ params, request, session });

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: { editMode: false, typeOfApplication: 'adult' } });

  return redirect(getPathById('public/apply/$id/adult/applicant-information', params));
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
        <p>{t('apply-adult-child:eligibility.apply-yourself.ineligible-to-apply')}</p>
        <p>{t('apply-adult-child:eligibility.apply-yourself.eligibility-info')}</p>
        <p>{t('apply-adult-child:eligibility.apply-yourself.eligibility-2025')}</p>
        <p>
          <InlineLink to={t('apply-adult-child:eligibility.apply-yourself.when-to-apply-href')} className="external-link" newTabIndicator target="_blank">
            {t('apply-adult-child:eligibility.apply-yourself.when-to-apply')}
          </InlineLink>
        </p>
        <p>{t('apply-adult-child:eligibility.apply-yourself.submit-application')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink
          id="back-button"
          routeId="public/apply/$id/adult-child/date-of-birth"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Apply for yourself click"
        >
          {t('apply-adult-child:eligibility.apply-yourself.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" id="proceed-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Proceed - Apply for yourself click">
          {t('apply-adult-child:eligibility.apply-yourself.proceed-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}

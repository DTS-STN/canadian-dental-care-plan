import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState, saveApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.childInformation,
  pageTitleI18nKey: 'apply-adult-child:child-summary.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:child-summary.page-title') }) };

  await saveApplyAdultChildState({ params, request, session, state: { editMode: true } });

  return json({ id: state.id, csrfToken, meta, defaultState: state.adultChildState.childInformation });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/child-summary');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }
  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/personal-information', params));
}

export default function ApplyFlowChildSummary() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={40} size="lg" />
      </div>
      <div className="max-w-prose">
        <fetcher.Form method="post" aria-describedby="form-instructions-sin form-instructions" noValidate>
          {defaultState?.firstName && (
            <>
              <p className="mb-6">{t('apply-adult-child:child-summary.children-added')}</p>
              <input type="hidden" name="_csrf" value={csrfToken} />
              <DescriptionListItem
                term={
                  <>
                    <h2 className="text-2xl font-semibold">{`${defaultState.firstName} ${defaultState.lastName}`}</h2>
                    <InlineLink className="text-sm font-normal" id="remove-child" routeId="$lang+/_public+/apply+/$id+/adult-child/child-information" params={params}>
                      {t('apply-adult-child:child-summary.remove-child')}
                    </InlineLink>
                  </>
                }
              >
                <dl className="divide-y border-y">
                  <DescriptionListItem term={t('apply-adult-child:child-summary.dob-title')}>
                    <p>{defaultState.dateOfBirth}</p>
                    <p className="mt-4">
                      <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult-child/child-information" params={params}>
                        {t('apply-adult-child:child-summary.dob-change')}
                      </InlineLink>
                    </p>
                  </DescriptionListItem>
                  <DescriptionListItem term={t('apply-adult-child:child-summary.sin-title')}>
                    <p>{defaultState.socialInsuranceNumber}</p>
                    <p className="mt-4">
                      <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult-child/child-information" params={params}>
                        {t('apply-adult-child:child-summary.sin-change')}
                      </InlineLink>
                    </p>
                  </DescriptionListItem>
                </dl>
              </DescriptionListItem>
            </>
          )}

          {!defaultState?.firstName && <p>{t('apply-adult-child:child-summary.no-children')}</p>}

          <ButtonLink
            className="mb-10"
            id="add-child"
            routeId="$lang+/_public+/apply+/$id+/adult-child/child-information"
            params={params}
            disabled={isSubmitting}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click"
          >
            <FontAwesomeIcon icon={faPlus} className="me-3 block size-4" />
            {t('apply-adult-child:child-summary.add-child')}
          </ButtonLink>

          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button id="continue-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Applicant Information click">
              {t('apply-adult-child:child-summary.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult-child/child-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-adult-child:child-summary.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

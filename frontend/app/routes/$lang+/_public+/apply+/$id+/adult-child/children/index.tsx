import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';
import { z } from 'zod';

import pageIds from '../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { getChildrenState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum FormAction {
  Add = 'add',
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.childInformation,
  pageTitleI18nKey: 'apply-adult-child:children.index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.index.page-title') }) };

  return json({ id: state.id, csrfToken, meta, children: getChildrenState(state, false) });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });

  const log = getLogger('apply/adult-child/child-summary');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Add) {
    const childId = randomUUID();
    const children = [...getChildrenState(state, false), { id: childId }];
    saveApplyState({ params, session, state: { children } });
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/information', { ...params, childId }));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/personal-information', params));
}

export default function ApplyFlowChildSummary() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, children } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const hasChildren = children.length > 0;

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
          <input type="hidden" name="_csrf" value={csrfToken} />
          {!hasChildren ? (
            <p>{t('apply-adult-child:children.index.no-children')}</p>
          ) : (
            <>
              <p className="mb-6">{t('apply-adult-child:children.index.children-added')}</p>
              {children.map((child) => {
                return (
                  <Fragment key={child.id}>
                    <h2 className="text-2xl font-semibold">{`${child.information?.firstName} ${child.information?.lastName}`}</h2>
                    <Button variant="alternative" size="xs" id="remove-child" className="my-2">
                      {t('apply-adult-child:children.index.remove-child')}
                    </Button>
                    <dl className="mb-6 divide-y border-y">
                      <DescriptionListItem term={t('apply-adult-child:children.index.dob-title')}>
                        <p>{child.information?.dateOfBirth}</p>
                        <p className="mt-4">
                          <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/information" params={{ ...params, childId: child.id }}>
                            {t('apply-adult-child:children.index.dob-change')}
                          </InlineLink>
                        </p>
                      </DescriptionListItem>
                      <DescriptionListItem term={t('apply-adult-child:children.index.sin-title')}>
                        <p>{child.information?.socialInsuranceNumber}</p>
                        <p className="mt-4">
                          <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult-child/children/$childId/information" params={{ ...params, childId: child.id }}>
                            {t('apply-adult-child:children.index.sin-change')}
                          </InlineLink>
                        </p>
                      </DescriptionListItem>
                    </dl>
                  </Fragment>
                );
              })}
            </>
          )}

          <Button className="mb-10" id="add-child" name="_action" value={FormAction.Add} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click">
            <FontAwesomeIcon icon={faPlus} className="me-3 block size-4" />
            {t('apply-adult-child:children.index.add-child')}
          </Button>

          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button id="continue-button" name="_action" value={FormAction.Continue} variant="primary" disabled={!hasChildren || isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Applicant Information click">
              {t('apply-adult-child:children.index.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink
              id="back-button"
              routeId="$lang+/_public+/apply+/$id+/adult-child/federal-provincial-territorial-benefits"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-adult-child:children.index.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

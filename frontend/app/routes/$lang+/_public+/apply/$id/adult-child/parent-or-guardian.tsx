import { FormEvent } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState, getAgeCategoryFromDateString } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.parentOrGuardian,
  pageTitleI18nKey: 'apply-adult-child:parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:parent-or-guardian.page-title') }) };

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory !== 'children' && ageCategory !== 'youth') {
    return redirect(getPathById('$lang+/_public+/apply/$id/adult/date-of-birth', params));
  }

  return json({ id: state.id, csrfToken, meta, ageCategory });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/parent-or-guardian');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  clearApplyState({ params, session });
  return redirect(t('apply-adult-child:parent-or-guardian.return-btn-link'));
}

export default function ApplyFlowParentOrGuardian() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, ageCategory } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  const noWrap = <span className="whitespace-nowrap" />;

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>{t('apply-adult-child:parent-or-guardian.unable-to-apply-child')}</p>
        <p>{t('apply-adult-child:parent-or-guardian.unable-to-apply')}</p>
        {ageCategory === 'youth' && (
          <p>
            <Trans ns={handle.i18nNamespaces} i18nKey="parent-or-guardian.service-canada" components={{ noWrap }} />
          </p>
        )}
        <p>{t('apply-adult-child:parent-or-guardian.eligibility')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink
          id="back-button"
          routeId="$lang+/_public+/apply/$id/adult-child/date-of-birth"
          params={params}
          disabled={isSubmitting}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Parent or guardian needs to apply click"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-adult-child:parent-or-guardian.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Parent or guardian needs to apply click">
          {t('apply-adult-child:parent-or-guardian.return-btn')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </Button>
      </fetcher.Form>
    </>
  );
}

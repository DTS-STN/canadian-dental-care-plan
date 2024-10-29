import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.summary,
  pageTitleI18nKey: 'demographic-survey:summary.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, request, params }: LoaderFunctionArgs) {
  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:summary.page-title') }) };

  // TODO fetch real data
  const members = [
    { id: 1, firstName: 'John', lastName: 'Doe' },
    { id: 2, firstName: 'Jane', lastName: 'Doe' },
  ];

  return json({ csrfToken, meta, members });
}

export async function action({ context: { configProvider, serviceProvider, session }, request, params }: ActionFunctionArgs) {
  const log = getLogger('demographic-survey/summary');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  return redirect(getPathById('public/demographich-survey/summary', params));
}

export default function DemographicSurveySummary() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, members } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const params = useParams();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-6">
        <p>{t('demographic-survey:summary.provide-a-response')}</p>
        <dl className="space-y-2">
          <dt>
            <strong>{t('demographic-survey:summary.please-select')}</strong>
          </dt>
          {members.map((member) => (
            <dd key={member.id}>
              <InlineLink routeId="public/demographic-survey/questions/$memberId" params={{ ...params, memberId: member.id.toString() }}>
                {`${member.firstName} ${member.lastName}`}
              </InlineLink>
            </dd>
          ))}
        </dl>
        <p>{t('demographic-survey:summary.when-you-have-finished')}</p>
      </div>
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="continue-button"
            name="_action"
            value={FormAction.Continue}
            variant="primary"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Marital status click"
          >
            {t('demographic-survey:summary.continue-btn')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="public/demographic-survey/submitted" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Marital status click">
            {t('demographic-survey:summary.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

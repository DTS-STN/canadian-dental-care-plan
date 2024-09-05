import type { SyntheticEvent } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button } from '~/components/buttons';
import { ClientFriendlyStatusMarkdown } from '~/components/client-friendly-status-markdown';
import { ContextualAlert } from '~/components/contextual-alert';
import { useFeature } from '~/root';
import { clearStatusState, loadStatusState } from '~/route-helpers/status-route-helpers.server';
import { featureEnabled } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';

enum FormAction {
  Cancel = 'cancel',
  Exit = 'exit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.result,
  pageTitleI18nKey: 'status:result.page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { statusCheckResult } = loadStatusState({ params, session });

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:result.page-title') }) };

  return json({ statusResult: statusCheckResult, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const t = await getFixedT(request, handle.i18nNamespaces);
  const log = getLogger('status/result/index');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  clearStatusState({ params, session });

  if (formAction === FormAction.Cancel) {
    return redirect(getPathById('$lang/_public/status/index', params));
  } else {
    return redirect(t('status:result.exit-link'));
  }
}

export default function StatusCheckerResult() {
  const { statusResult, csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);

  const statusCheckerRedirectFlag = useFeature('status-checker-redirects');

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
      <input type="hidden" name="_csrf" value={csrfToken} />

      <div className="max-w-prose">
        {statusResult && !statusResult.statusId ? (
          <StatusNotFound />
        ) : (
          <ContextualAlert type={statusResult?.alertType ?? 'warning'}>
            <div>
              <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
                {t('status:result.status-heading')}
              </h2>
              {statusResult?.name && <ClientFriendlyStatusMarkdown content={statusResult.name} />}
            </div>
          </ContextualAlert>
        )}
        <div className="mt-12">
          <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} variant="primary" endIcon={faChevronRight}>
            {t('status:result.check-another')}
          </Button>
        </div>
        {statusCheckerRedirectFlag && (
          <div className="mt-6">
            <Button id="exit-button" name="_action" value={FormAction.Exit} disabled={isSubmitting} className="mt-6">
              {t('status:result.exit-btn')}
            </Button>
          </div>
        )}
      </div>
    </fetcher.Form>
  );
}

function StatusNotFound() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const noWrap = <span className="whitespace-nowrap" />;
  return (
    <div className="mb-4">
      <ContextualAlert type="danger">
        <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
          {t('result.status-not-found.heading')}
        </h2>
        <p className="mb-2">{t('result.status-not-found.please-review')}</p>
        <p className="mb-2">{t('result.status-not-found.if-submitted')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="result.status-not-found.contact-service-canada" components={{ noWrap }} />
        </p>
      </ContextualAlert>
    </div>
  );
}
import type { SyntheticEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { clearStatusState, getStatusStateIdFromUrl, loadStatusState } from '~/.server/routes/helpers/status-route-helpers';
import { getContextualAlertType } from '~/.server/utils/application-code.utils';
import { featureEnabled } from '~/.server/utils/env.utils';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { Button } from '~/components/buttons';
import { ClientFriendlyStatusMarkdown } from '~/components/client-friendly-status-markdown';
import { ContextualAlert } from '~/components/contextual-alert';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Cancel = 'cancel',
  Exit = 'exit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.result,
  pageTitleI18nKey: 'status:result.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');

  const statusStateId = getStatusStateIdFromUrl(request.url);
  const { statusCheckResult } = loadStatusState({ id: statusStateId, params, session });

  const locale = getLocale(request);

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('status:result.page-title') }) };

  const statusId = statusCheckResult.statusId ?? null;
  const alertType = getContextualAlertType(statusId);
  const clientFriendlyStatus = statusId ? appContainer.get(TYPES.domain.services.ClientFriendlyStatusService).getLocalizedClientFriendlyStatusById(statusId, locale) : null;

  return {
    statusResult: { alertType, clientFriendlyStatus },
    csrfToken,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  featureEnabled('status');

  const statusStateId = getStatusStateIdFromUrl(request.url);
  const { id } = loadStatusState({ id: statusStateId, params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Cancel) {
    return redirect(getPathById('public/status/index', params));
  }

  clearStatusState({ id, params, session });
  return redirect(t('status:result.exit-link'));
}

export default function StatusCheckerResult() {
  const { statusResult, csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);

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
        {statusResult.clientFriendlyStatus ? (
          <ContextualAlert type={statusResult.alertType}>
            <h2 className="mb-2 font-bold">{t('status:result.status-heading')}</h2>
            <ClientFriendlyStatusMarkdown content={statusResult.clientFriendlyStatus.name} />
          </ContextualAlert>
        ) : (
          <StatusNotFound />
        )}
        <div className="mt-12">
          <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} variant="primary" endIcon={faChevronRight}>
            {t('status:result.check-another')}
          </Button>
        </div>
        <div className="mt-6">
          <Button id="exit-button" name="_action" value={FormAction.Exit} disabled={isSubmitting} className="mt-6">
            {t('status:result.exit-btn')}
          </Button>
        </div>
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
        <h2 className="mb-2 font-bold">{t('result.status-not-found.heading')}</h2>
        <p className="mb-2">{t('result.status-not-found.please-review')}</p>
        <p className="mb-2">{t('result.status-not-found.if-submitted')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="result.status-not-found.contact-service-canada" components={{ noWrap }} />
        </p>
      </ContextualAlert>
    </div>
  );
}

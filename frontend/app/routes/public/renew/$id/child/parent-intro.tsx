import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
  Back = 'back',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.parentIntro,
  pageTitleI18nKey: 'renew-child:parent-intro.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:parent-intro.page-title') }) };

  return { id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Back) {
    return redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  return redirect(getPathById('public/renew/$id/child/confirm-marital-status', params));
}

export default function RenewChildParentIntro() {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [submitAction, setSubmitAction] = useState<string>();

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    setSubmitAction(submitter.value);

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('renew-child:parent-intro.description')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="continue-button"
            name="_action"
            value={FormAction.Continue}
            variant="primary"
            loading={isSubmitting && submitAction === FormAction.Continue}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Continue - Parent intro click"
          >
            {t('renew-child:parent-intro.continue-btn')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Parent intro click">
            {t('renew-child:parent-intro.back-btn')}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}

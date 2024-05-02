import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { useUserOrigin } from '~/utils/user-origin-utils';

enum ConfirmSubscriptionCode {
  NewCode = 'new-code',
  Submit = 'submit',
}

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'alerts:confirm.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('alerts', 'gcweb'),
  pageIdentifier: pageIds.protected.alerts.confirm,
  pageTitleI18nKey: 'alerts:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});
export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);
  const instrumentationService = getInstrumentationService();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('alerts:confirm.page-title') }) };

  instrumentationService.countHttpStatus('alerts.confirm', 302);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin ?? '');
  session.set('alertSubscription', alertSubscription);

  const confirmationCodeEntered = session.get('codeEntered') ?? '';

  return json({ csrfToken, meta, alertSubscription, userInfoToken, confirmationCodeEntered }); //TODO get the language and email address entered by the user when they entered their information on the index route...
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const alertSubscription = session.get('alertSubscription');
  const action = formData.get('action');
  const instrumentationService = getInstrumentationService();

  const formDataSchema = z.object({
    confirmationCode: z.string().trim().max(100).optional(),
  });
  const data = {
    confirmationCode: formData.get('confirmationCode') ? String(formData.get('confirmationCode')) : undefined,
  };

  const parsedDataResult = formDataSchema.safeParse(data);
  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('alerts.confirm', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  if (action === ConfirmSubscriptionCode.NewCode) {
    //TODO implement the code to request a new code and link that new code to the clients profile
  }
  if (action === ConfirmSubscriptionCode.Submit) {
    session.set('codeEntered', parsedDataResult.data.confirmationCode);
    const response = await getSubscriptionService().validateConfirmationCode(alertSubscription?.email ?? '', parsedDataResult.data.confirmationCode ?? '', userInfoToken.sub);
    const jsonReponseStatus = await response.json();

    if (jsonReponseStatus.confirmCodeStatus === 'valid') {
      //TODO Complete logic
    }
    if (jsonReponseStatus.confirmCodeStatus === 'expired') {
      return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/expired', params));
    }
    if (jsonReponseStatus.confirmCodeStatus === 'mismatch') {
      //TODO Complete logic
    }
  }

  return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/confirm', params));
}

export default function ConfirmSubscription() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, confirmationCodeEntered, alertSubscription } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const userOrigin = useUserOrigin();
  const errorSummaryId = 'error-summary';
  //TODO insert the selected language and email address of the client...
  const errorMessages = useMemo(
    () => ({
      confirmationCode: fetcher.data?.errors.confirmationCode?._errors[0],
    }),
    [fetcher.data?.errors.confirmationCode?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  const defaultValues = {
    confirmationCode: confirmationCodeEntered,
  };
  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);
  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mb-8 space-y-6">
          <ContextualAlert type="info">
            <p id="confirmation-information" className="mb-4">
              <Trans ns={handle.i18nNamespaces} i18nKey="alerts:confirm.confirmation-information-text" values={{ userEmailAddress: alertSubscription?.email }} />
            </p>
            <p id="confirmation-completed" className="mb-4">
              {t('alerts:confirm.confirmation-completed-text')}
            </p>
            <div className="grid gap-12 md:grid-cols-2">
              <p id="confirmation-language" className="mb-4 font-bold">
                {t('alerts:confirm.confirmation-selected-language')}
              </p>

              <p>{t('alerts:confirm.no-preferred-language-on-file')}</p>
            </div>
          </ContextualAlert>
          <InputField id="confirmationCode" className="w-full" label={t('alerts:confirm.confirmation-code-label')} maxLength={100} name="confirmationCode" defaultValue={defaultValues.confirmationCode} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={userOrigin?.to} params={params}>
            {t('alerts:confirm.back')}
          </ButtonLink>
          <Button id="new-code-button" name="action" value={ConfirmSubscriptionCode.NewCode} variant="alternative">
            {t('alerts:confirm.request-new-code')}
          </Button>
          <Button id="submit-button" name="action" value={ConfirmSubscriptionCode.Submit} variant="primary">
            {t('alerts:confirm.submit-code')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}

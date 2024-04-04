import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { InputField } from '~/components/input-field';
import { PublicLayout } from '~/components/layouts/public-layout';
import { getApplicationStatusService } from '~/services/application-status-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status,
  pageTitleI18nKey: 'status:page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:page-title') }) };

  return json({ meta, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('status/index');
  const { CLIENT_STATUS_SUCCESS_ID } = getEnv();

  const formDataSchema = z.object({
    sin: z.string().trim().min(1, { message: 'Please enter your SIN' }),
    code: z.string().trim().min(1, { message: 'Please enter your application code' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const applicationStatusService = getApplicationStatusService();
  const lookupService = getLookupService();
  const { sin, code } = parsedDataResult.data;
  const statusId = await applicationStatusService.getStatusId(sin, code);

  const clientStatusList = await lookupService.getAllClientFriendlyStatuses();
  const clientFriendlyStatus = clientStatusList.find((status) => status.id === statusId);

  return json({
    status: {
      ...(clientFriendlyStatus ?? {}),
      alertType: clientFriendlyStatus?.id === CLIENT_STATUS_SUCCESS_ID ? 'success' : 'info',
    },
  } as const);
}

export default function StatusChecker() {
  const { csrfToken } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  const hcaptchaTermsOfService = <InlineLink to={t('status:links.hcaptcha')} />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('status:links.microsoft-data-privacy-policy')} />;
  const microsoftServiceAgreement = <InlineLink to={t('status:links.microsoft-service-agreement')} />;
  const fileacomplaint = <InlineLink to={t('status:links.file-complaint')} />;
  // TODO use <PublicLayout> for now
  return (
    <PublicLayout>
      <div className="max-w-prose">
        <div className="space-y-4">
          <h2 className="font-bold">{t('status:status-checker-heading')}</h2>
          <p>{t('status:status-checker-content')}</p>
          <h2 className="font-bold">{t('status:online-status-heading')}</h2>
          <p>{t('status:online-status-content')}</p>
        </div>
        <Collapsible summary={t('status:terms-of-use.summary')} className="mt-8">
          <div className="space-y-4">
            <h2 className="mb-4 font-bold">{t('status:terms-of-use.heading')}</h2>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.legal-terms" />
            </p>
            <p>{t('status:terms-of-use.access-terms')}</p>
            <p>{t('status:terms-of-use.usage-terms')}</p>
            <p>{t('status:terms-of-use.terms-rejection-policy')}</p>
            <p>{t('status:terms-of-use.esdc-definition-clarification')}</p>
            <p className="font-bold">{t('status:terms-of-use.status-checker.heading')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('status:terms-of-use.status-checker.self-agreement')}</li>
              <li>{t('status:terms-of-use.status-checker.on-behalf-of-someone-else')}</li>
              <li>{t('status:terms-of-use.status-checker.at-your-own-risk')}</li>
              <li>{t('status:terms-of-use.status-checker.only-use')}</li>
              <li>{t('status:terms-of-use.status-checker.maintenance')}</li>
              <li>{t('status:terms-of-use.status-checker.inactive')}</li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.msdc" components={{ microsoftServiceAgreement }} />
              </li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="status:terms-of-use.status-checker.antibot" components={{ hcaptchaTermsOfService }} />
              </li>
            </ul>
            <h2 className="font-bold">{t('status:terms-of-use.disclaimers.heading')}</h2>
            <p>{t('status:terms-of-use.disclaimers.disclaimers')}</p>
            <ol className="list-decimal space-y-1 pl-7">
              <li>{t('status:terms-of-use.disclaimers.external-factors-disclaimer')}</li>
              <li>{t('status:terms-of-use.disclaimers.non-acceptance')}</li>
              <li>{t('status:terms-of-use.disclaimers.non-compliance')}</li>
            </ol>
            <h2 className="font-bold">{t('status:terms-of-use.changes-to-these-terms-of-use.heading')}</h2>
            <p>{t('status:terms-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
          </div>
        </Collapsible>
        <Collapsible summary={t('status:privacy-notice-statement.summary')} className="my-8">
          <div className="space-y-4">
            <p>{t('status:privacy-notice-statement.collection-of-use')}</p>
            <p>{t('status:privacy-notice-statement.provided-information')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.third-party-provider" components={{ microsoftDataPrivacyPolicy }} />
            </p>
            <p>{t('status:privacy-notice-statement.personal-information')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="status:privacy-notice-statement.report-a-concern" components={{ fileacomplaint }} />
            </p>
          </div>
        </Collapsible>
        <Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <InputField id="code" name="code" label={t('status:form.application-code-label')} helpMessagePrimary={t('status:form.application-code-description')} required />
            <InputField id="sin" name="sin" label={t('status:form.sin-label')} required />
          </div>
          <Button className="my-8" id="submit" variant="primary">
            {t('status:form.submit')}
          </Button>
        </Form>

        {actionData && 'status' in actionData && (
          <ContextualAlert type={actionData.status.alertType}>
            <div>
              <h2 className="mb-2 font-bold" tabIndex={-1}>
                Status
              </h2>
              {getNameByLanguage(i18n.language, actionData.status)}
            </div>
          </ContextualAlert>
        )}
      </div>
    </PublicLayout>
  );
}

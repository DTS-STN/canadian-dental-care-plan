import { useEffect, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/verify-email';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits } from '~/utils/string-utils';

const MAX_ATTEMPTS = 5;

const FORM_ACTION = {
  request: 'request',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.verifyEmail,
  pageTitleI18nKey: 'protected-profile:verify-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:verify-email.page-title') }) };

  if (!session.has('profileEmailVerificationState')) {
    throw redirect(getPathById('protected/profile/contact/email-address', params));
  }

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.verify-email', { userId: idToken.sub });

  return {
    meta,
    email: session.get('profileEmailVerificationState').pendingEmail,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  if (!session.has('profileEmailVerificationState')) {
    throw redirect(getPathById('protected/profile/contact/email-address', params));
  }

  const verificationState = session.get('profileEmailVerificationState');

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sub, 'Expected userInfoToken.sub to be defined');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const idToken = session.get('idToken');
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);

  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);
  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.verify-email', { userId: idToken.sub });

  if (formAction === FORM_ACTION.request) {
    const newVerificationCode = verificationCodeService.createVerificationCode(idToken.sub);

    session.set('profileEmailVerificationState', {
      ...verificationState,
      verificationCode: newVerificationCode,
      verificationAttempts: 0,
    });

    await verificationCodeService.sendVerificationCodeEmail({
      email: verificationState.pendingEmail,
      verificationCode: newVerificationCode,
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });

    return { status: 'verification-code-sent' } as const;
  }

  const verificationCodeSchema = z.object({
    verificationCode: z
      .string()
      .trim()
      .min(1, t('protected-profile:verify-email.error-message.verification-code-required'))
      .transform(extractDigits)
      .superRefine((val, ctx) => {
        if (verificationState.verificationAttempts >= MAX_ATTEMPTS) {
          ctx.addIssue({ code: 'custom', message: t('protected-profile:verify-email.error-message.verification-code-max-attempts'), path: ['verificationCode'] });
        }
      }),
  });

  const parsedDataResult = verificationCodeSchema.safeParse({
    verificationCode: formData.get('verificationCode') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  if (parsedDataResult.data.verificationCode !== verificationState.verificationCode) {
    const updatedAttempts = verificationState.verificationAttempts + 1;

    session.set('profileEmailVerificationState', {
      ...verificationState,
      verificationAttempts: updatedAttempts,
    });

    return { status: 'verification-code-mismatch' } as const;
  }

  await appContainer.get(TYPES.ProfileService).updateEmailAddress({ email: verificationState.pendingEmail });

  session.unset('profileEmailVerificationState');

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function ProtectedProfileVerifyEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { email } = loaderData;
  const [showDialog, setShowDialog] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { verificationCode: 'verification-code' });
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'verification-code-mismatch');

  const communicationLink = <InlineLink routeId="protected/profile/communication-preferences" params={params} />;

  useEffect(() => {
    if (fetcherStatus === 'verification-code-sent') {
      setShowDialog(true);
    }
  }, [fetcherStatus, fetcher.data]);

  return (
    <div className="max-w-prose">
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('protected-profile:verify-email.verification-code-alert.heading')}</h2>
        <p className="mb-2">{t('protected-profile:verify-email.verification-code-alert.detail')}</p>
      </ErrorAlert>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <p className="mb-4">{t('protected-profile:verify-email.verification-code', { email })}</p>
          <p className="mb-4">{t('protected-profile:verify-email.request-new')}</p>
          <p className="mb-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:verify-email.unable-to-verify" components={{ communicationLink }} />
          </p>
          <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
          <div className="grid items-end gap-6 md:grid-cols-2">
            <InputField
              id="verification-code"
              name="verificationCode"
              className="w-full"
              errorMessage={errors?.verificationCode}
              label={t('protected-profile:verify-email.verification-code-label')}
              aria-describedby="verification-code"
              inputMode="numeric"
              required
            />
          </div>
          <LoadingButton
            id="request-button"
            type="button"
            name="_action"
            variant="link"
            className="no-underline hover:underline"
            loading={isSubmitting}
            value={FORM_ACTION.request}
            onClick={async () => {
              const formData = new FormData();
              formData.append('_action', FORM_ACTION.request);

              const csrfTokenInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
              formData.append('_csrf', csrfTokenInput.value);

              await fetcher.submit(formData, { method: 'post' });
            }}
          >
            {t('protected-profile:verify-email.request-new-code')}
          </LoadingButton>
        </fieldset>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="continue-button" name="_action" value={FORM_ACTION.submit} loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Continue - Verify your email address click">
            {t('protected-profile:verify-email.continue')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/contact/email-address" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Verify your email address click">
            {t('protected-profile:verify-email.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('protected-profile:verify-email.code-sent.heading')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('protected-profile:verify-email.code-sent.detail', { email })}</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="modal-continue" disabled={isSubmitting} variant="primary" size="sm">
                {t('protected-profile:verify-email.continue')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

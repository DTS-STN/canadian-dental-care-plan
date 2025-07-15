import { useEffect, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/verify-email';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
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
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits } from '~/utils/string-utils';

const FORM_ACTION = {
  request: 'request',
  submit: 'submit',
} as const;

const MAX_ATTEMPTS = 5;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.verifyEmail,
  pageTitleI18nKey: 'renew-ita:verify-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:verify-email.page-title') }) };

  return {
    meta,
    email: state.editModeEmail ?? state.email,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);

  // Fetch verification code service
  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.request) {
    // Create a new verification code and store the code in session
    const verificationCode = verificationCodeService.createVerificationCode('anonymous');

    saveRenewState({
      params,
      session,
      state: {
        verifyEmail: {
          verificationCode,
          verificationAttempts: 0,
        },
        emailVerified: false, // Reset emailVerified when requesting a new code
      },
    });

    invariant(state.clientApplication, 'Expected clientApplication to be defined');
    if (state.editMode) {
      invariant(state.editModeEmail, 'Expected editModeEmail to be defined');
      await verificationCodeService.sendVerificationCodeEmail({
        email: state.editModeEmail,
        verificationCode: verificationCode,
        preferredLanguage: state.clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
        userId: 'anonymous',
      });
      return { status: 'verification-code-sent' } as const;
    } else if (state.email) {
      await verificationCodeService.sendVerificationCodeEmail({
        email: state.email,
        verificationCode: verificationCode,
        preferredLanguage: state.clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
        userId: 'anonymous',
      });
      return { status: 'verification-code-sent' } as const;
    }
  }

  if (formAction === FORM_ACTION.submit) {
    const verificationCodeSchema = z.object({
      verificationCode: z
        .string()
        .trim()
        .min(1, t('renew-ita:verify-email.error-message.verification-code-required'))
        .transform(extractDigits)
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .superRefine((val, ctx) => {
          if (state.verifyEmail && state.verifyEmail.verificationAttempts >= MAX_ATTEMPTS) {
            ctx.addIssue({ code: 'custom', message: t('renew-ita:verify-email.error-message.verification-code-max-attempts'), path: ['verificationCode'] });
          }
        }),
    });

    const parsedDataResult = verificationCodeSchema.safeParse({
      verificationCode: formData.get('verificationCode') ?? '',
    });

    if (!parsedDataResult.success) {
      return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
    }

    // Check if the verification code matches
    if (state.verifyEmail && state.verifyEmail.verificationCode !== parsedDataResult.data.verificationCode) {
      const verificationAttempts = state.verifyEmail.verificationAttempts + 1;
      saveRenewState({
        params,
        session,
        state: {
          verifyEmail: {
            ...state.verifyEmail,
            verificationAttempts,
          },
        },
      });

      return { status: 'verification-code-mismatch' } as const;
    }

    if (state.verifyEmail) {
      if (state.editMode) {
        saveRenewState({
          params,
          session,
          state: {
            communicationPreferences: state.editModeCommunicationPreferences ?? state.communicationPreferences,
            email: state.editModeEmail,
            verifyEmail: {
              ...state.verifyEmail,
              verificationAttempts: 0,
            },
            emailVerified: true,
          },
        });
        return redirect(getPathById('public/renew/$id/ita/review-information', params));
      }
      saveRenewState({
        params,
        session,
        state: {
          verifyEmail: {
            ...state.verifyEmail,
            verificationAttempts: 0,
          },
          emailVerified: true,
        },
      });
    }

    return redirect(getPathById('public/renew/$id/ita/confirm-address', params));
  }
}

export default function RenewFlowVerifyEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { email, editMode } = loaderData;
  const [showDialog, setShowDialog] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { verificationCode: 'verification-code' });
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'verification-code-mismatch');

  const communicationLink = <InlineLink routeId="public/renew/$id/ita/communication-preference" params={params} />;

  useEffect(() => {
    if (fetcherStatus === 'verification-code-sent') {
      setShowDialog(true);
    }
  }, [fetcherStatus, fetcher.data]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={63} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('renew-ita:verify-email.verification-code-alert.heading')}</h2>
          <p className="mb-2">{t('renew-ita:verify-email.verification-code-alert.detail')}</p>
        </ErrorAlert>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <p className="mb-4">{t('renew-ita:verify-email.verification-code', { email })}</p>
            <p className="mb-4">{t('renew-ita:verify-email.request-new')}</p>
            <p className="mb-8">
              <Trans ns={handle.i18nNamespaces} i18nKey="renew-ita:verify-email.unable-to-verify" components={{ communicationLink }} />
            </p>
            <p className="mb-4 italic">{t('renew:required-label')}</p>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="verification-code"
                name="verificationCode"
                className="w-full"
                errorMessage={errors?.verificationCode}
                label={t('renew-ita:verify-email.verification-code-label')}
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
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Request new verification code - Verify email click"
              onClick={async () => {
                const formData = new FormData();
                formData.append('_action', FORM_ACTION.request);

                const csrfTokenInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
                formData.append('_csrf', csrfTokenInput.value);

                await fetcher.submit(formData, { method: 'post' });
              }}
            >
              {t('renew-ita:verify-email.request-new-code')}
            </LoadingButton>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <LoadingButton variant="primary" id="save-button" loading={isSubmitting} name="_action" value={FORM_ACTION.submit} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Verify email click">
                {t('renew-ita:verify-email.save-btn')}
              </LoadingButton>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Verify email click">
                {t('renew-ita:verify-email.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" name="_action" value={FORM_ACTION.submit} loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Verify email">
                {t('renew-ita:verify-email.continue')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/confirm-email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Verify email click">
                {t('renew-ita:verify-email.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('renew-ita:verify-email.code-sent.heading')}</DialogTitle>
            </DialogHeader>
            <DialogDescription>{t('renew-ita:verify-email.code-sent.detail', { email })}</DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button id="modal-continue" disabled={isSubmitting} variant="primary" endIcon={faChevronRight} size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Modal Continue - Verify email click">
                  {t('renew-ita:verify-email.continue')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

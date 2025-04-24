import { useEffect, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import type { Route } from './+types/verify-email';

import { TYPES } from '~/.server/constants';
import { loadApplyChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
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

export const PREFERRED_LANGUAGE = { en: 'English', fr: 'French' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.verifyEmail,
  pageTitleI18nKey: 'apply-child:verify-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:verify-email.page-title') }) };

  return {
    meta,
    email: state.editModeEmail ?? state.email,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // Fetch verification code service
  const verificationCodeService = appContainer.get(TYPES.domain.services.VerificationCodeService);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.request) {
    // Create a new verification code and store the code in session
    const verificationCode = verificationCodeService.createVerificationCode('anonymous');

    saveApplyState({
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

    if (state.editMode) {
      invariant(state.editModeEmail, 'Expected editModeEmail to be defined');
      invariant(state.editModeCommunicationPreferences, 'Expected editModeCommunicationPreferences to be defined');
      const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.editModeCommunicationPreferences.preferredLanguage, locale).name;
      await verificationCodeService.sendVerificationCodeEmail({
        email: state.editModeEmail,
        verificationCode: verificationCode,
        preferredLanguage: preferredLanguage === PREFERRED_LANGUAGE.en ? 'en' : 'fr',
        userId: 'anonymous',
      });
      return { status: 'verification-code-sent' } as const;
    } else if (state.email && state.communicationPreferences?.preferredLanguage) {
      const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale).name;
      await verificationCodeService.sendVerificationCodeEmail({
        email: state.email,
        verificationCode: verificationCode,
        preferredLanguage: preferredLanguage === PREFERRED_LANGUAGE.en ? 'en' : 'fr',
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
        .min(1, t('apply-child:verify-email.error-message.verification-code-required'))
        .transform(extractDigits)
        .superRefine((val, ctx) => {
          if (state.verifyEmail && state.verifyEmail.verificationAttempts >= MAX_ATTEMPTS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:verify-email.error-message.verification-code-max-attempts'), path: ['verificationCode'] });
          }
        }),
    });

    const parsedDataResult = verificationCodeSchema.safeParse({
      verificationCode: formData.get('verificationCode') ?? '',
    });

    if (!parsedDataResult.success) {
      return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
    }

    // Check if the verification code matches
    if (state.verifyEmail && state.verifyEmail.verificationCode !== parsedDataResult.data.verificationCode) {
      const verificationAttempts = state.verifyEmail.verificationAttempts + 1;

      saveApplyState({
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
        saveApplyState({
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
        return redirect(getPathById('public/apply/$id/child/review-adult-information', params));
      }
      saveApplyState({
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

    return redirect(getPathById('public/apply/$id/child/review-child-information', params));
  }
}

export default function ApplyFlowVerifyEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { email, editMode } = loaderData;
  const [showDialog, setShowDialog] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { verificationCode: 'verification-code' });
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'verification-code-mismatch');

  const communicationLink = <InlineLink routeId="public/apply/$id/child/communication-preference" params={params} />;

  useEffect(() => {
    if (fetcherStatus === 'verification-code-sent') {
      setShowDialog(true);
    }
  }, [fetcherStatus, fetcher.data]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={86} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <ErrorAlert>
          <h2 className="mb-2 font-bold">{t('apply-child:verify-email.verification-code-alert.heading')}</h2>
          <p className="mb-2">{t('apply-child:verify-email.verification-code-alert.detail')}</p>
        </ErrorAlert>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <p className="mb-4">{t('apply-child:verify-email.verification-code', { email })}</p>
            <p className="mb-4">{t('apply-child:verify-email.request-new')}</p>
            <p className="mb-8">
              <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:verify-email.unable-to-verify" components={{ communicationLink }} />
            </p>
            <p className="mb-4 italic">{t('apply:required-label')}</p>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="verification-code"
                name="verificationCode"
                className="w-full"
                errorMessage={errors?.verificationCode}
                label={t('apply-child:verify-email.verification-code-label')}
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
              loading={isSubmitting}
              value={FORM_ACTION.request}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Request new verification code - Verify email click"
              onClick={async () => {
                const formData = new FormData();
                formData.append('_action', FORM_ACTION.request);

                const csrfTokenInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
                formData.append('_csrf', csrfTokenInput.value);

                await fetcher.submit(formData, { method: 'post' });
              }}
            >
              {t('apply-child:verify-email.request-new-code')}
            </LoadingButton>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <LoadingButton variant="primary" id="save-button" loading={isSubmitting} name="_action" value={FORM_ACTION.submit} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Verify email click">
                {t('apply-child:verify-email.save-btn')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/apply/$id/child/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Verify email click">
                {t('apply-child:verify-email.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                name="_action"
                value={FORM_ACTION.submit}
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Verify email"
              >
                {t('apply-child:verify-email.continue')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/apply/$id/child/email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Verify email click">
                {t('apply-child:verify-email.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('apply-child:verify-email.code-sent.heading')}</DialogTitle>
            </DialogHeader>
            <DialogDescription>{t('apply-child:verify-email.code-sent.detail', { email })}</DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button id="modal-continue" disabled={isSubmitting} variant="primary" endIcon={faChevronRight} size="sm" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Modal Continue - Verify email click">
                  {t('apply-child:verify-email.continue')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

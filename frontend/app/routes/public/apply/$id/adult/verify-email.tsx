import { useRef } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/verify-email';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.verifyEmail,
  pageTitleI18nKey: 'apply-adult:verify-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:verify-email.page-title') }) };

  return {
    id: state.id,
    meta,
    email: state.email,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  // fetch verification code service
  const verificationCodeService = appContainer.get(TYPES.domain.services.VerificationCodeService);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.request) {
    // Check if the maximum number of attempts has been reached
    // TODO: Not sure what the error message is or where to display the error if max attempts reached (alert or field validation), returning status-not-found alert for now.
    if (state.verifyEmail?.verificationAttempts && state.verifyEmail.verificationAttempts >= MAX_ATTEMPTS) {
      return { status: 'status-not-found' } as const;
    }

    // Increment the verification attempts
    const verificationAttempts = (state.verifyEmail?.verificationAttempts ?? 1) + 1;

    // create a new verification code and store the code in session
    const verificationCode = verificationCodeService.createVerificationCode('anonymous');
    const verificationExpire = Date.now() + 5 * 60 * 1000;

    saveApplyState({
      params,
      session,
      state: {
        verifyEmail: {
          verificationCode,
          verificationAttempts,
          verificationExpire,
        },
      },
    });
    if (state.email && state.communicationPreferences?.preferredLanguage) {
      const preferredLanguage = appContainer.get(TYPES.domain.services.PreferredLanguageService).getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale).name;
      await verificationCodeService.sendVerificationCodeEmail({ email: state.email, verificationCode: verificationCode, preferredLanguage: preferredLanguage, userId: 'anonymous' });
    }
  }

  if (formAction === FORM_ACTION.submit) {
    const verificationCodeSchema = z.object({
      verificationCode: z.string().trim().min(1, t('apply-adult:verify-email.error-message.verification-code-required')).transform(extractDigits),
    });

    const parsedDataResult = verificationCodeSchema.safeParse({
      verificationCode: formData.get('verificationCode') ?? '',
    });

    if (!parsedDataResult.success) {
      return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
    }

    // If verfication code does not match input or verification code expired, display alert
    if (parsedDataResult.data.verificationCode !== state.verifyEmail?.verificationCode || (state.verifyEmail.verificationExpire && Date.now() > state.verifyEmail.verificationExpire)) {
      return { status: 'status-not-found' } as const;
    }

    return redirect(getPathById('public/apply/$id/adult/dental-insurance', params));
  }
}

export default function ApplyFlowVerifyEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { email } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { verificationCode: 'verification-code' });

  const communicationLink = <InlineLink routeId="public/apply/$id/adult/communication-preference" params={params} />;

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('apply:progress.label')} />
      </div>
      {fetcherStatus === 'status-not-found' && <StatusNotFound />}
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <p className="mb-4">{t('apply-adult:verify-email.verification-code', { email })}</p>
            <p className="mb-4">{t('apply-adult:verify-email.request-new')}</p>
            <p className="mb-8">
              <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:verify-email.unable-to-verify" components={{ communicationLink }} />
            </p>
            <p className="mb-4 italic">{t('apply:required-label')}</p>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="verification-code"
                name="verificationCode"
                className="w-full"
                errorMessage={errors?.verificationCode}
                label={t('apply-adult:verify-email.verification-code-label')}
                aria-describedby="verification-code"
                inputMode="numeric"
                required
              />
            </div>
            <LoadingButton id="request-button" name="_action" variant="link" loading={isSubmitting} value={FORM_ACTION.request} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Request new verification code - Verify email click">
              {t('apply-adult:verify-email.request-new-code')}
            </LoadingButton>
          </fieldset>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              variant="primary"
              id="continue-button"
              name="_action"
              value={FORM_ACTION.submit}
              loading={isSubmitting}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Verify email"
            >
              {t('apply-adult:verify-email.continue')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="public/apply/$id/adult/email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Verify email click">
              {t('apply-adult:verify-email.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

function StatusNotFound() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setWrapperRef = (node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ behavior: 'smooth' });
      node.focus();
    }
    wrapperRef.current = node;
  };

  return (
    <div ref={setWrapperRef} id="status-not-found" className="mb-4" role="region" aria-live="assertive" tabIndex={-1}>
      <ContextualAlert type="danger">
        <h2 className="mb-2 font-bold">{t('apply-adult:verify-email.status-not-found.heading')}</h2>
        <p className="mb-2">{t('apply-adult:verify-email.status-not-found.detail')}</p>
      </ContextualAlert>
    </div>
  );
}

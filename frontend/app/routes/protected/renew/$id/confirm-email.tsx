import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/confirm-email';

import { TYPES } from '~/.server/constants';
import { isInvitationToApplyClient, isPrimaryApplicantStateComplete, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmEmail,
  pageTitleI18nKey: 'protected-renew:confirm-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-email.page-title') }) };

  return {
    meta,
    defaultState: state.email ?? state.clientApplication.contactInformation.email,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');
  const idToken: IdToken = session.get('idToken');

  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);

  const emailSchema = z
    .object({
      email: z
        .string({ error: t('protected-renew:confirm-email.error-message.email-required') })
        .trim()
        .min(1)
        .max(64),
    })

    .superRefine((val, ctx) => {
      if (!validator.isEmail(val.email)) {
        ctx.addIssue({ code: 'custom', message: t('protected-renew:confirm-email.error-message.email-valid'), path: ['email'] });
      }
    });

  const parsedDataResult = emailSchema.safeParse({
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const isNewEmail = state.email !== parsedDataResult.data.email;
  const verificationCode = isNewEmail || state.verifyEmail === undefined ? verificationCodeService.createVerificationCode(idToken.sub) : state.verifyEmail.verificationCode;

  invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
  if (isNewEmail) {
    await verificationCodeService.sendVerificationCodeEmail({
      email: parsedDataResult.data.email,
      verificationCode,
      preferredLanguage: state.clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });
  }

  if (state.editMode) {
    // Redirect to /verify-email only if emailVerified is false
    if (isNewEmail || !state.emailVerified) {
      saveProtectedRenewState({
        params,
        request,
        session,
        state: {
          editModeEmail: parsedDataResult.data.email,
          ...(isNewEmail && {
            verifyEmail: {
              verificationCode,
              verificationAttempts: 0,
            },
          }),
        },
      });
      return redirect(getPathById('protected/renew/$id/verify-email', params));
    }
    // Save editMode data to state.
    saveProtectedRenewState({
      params,
      request,
      session,
      state: {
        communicationPreferences: state.editModeCommunicationPreferences,
        email: parsedDataResult.data.email,
        emailVerified: state.emailVerified,
        verifyEmail: {
          verificationCode,
          verificationAttempts: 0,
        },
      },
    });
    if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
      return redirect(getPathById('protected/renew/$id/review-child-information', params));
    }
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }
  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      email: parsedDataResult.data.email,
      emailVerified: isNewEmail ? false : state.emailVerified,
      ...(isNewEmail && {
        verifyEmail: {
          verificationCode,
          verificationAttempts: 0,
        },
      }),
    },
  });

  if (isNewEmail || !state.emailVerified) {
    return redirect(getPathById('protected/renew/$id/verify-email', params));
  }

  if (isInvitationToApplyClient(state.clientApplication)) {
    return redirect(getPathById('protected/renew/$id/dental-insurance', params));
  }

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
    return redirect(getPathById('protected/renew/$id/review-child-information', params));
  }

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { email: 'email' });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <p className="mb-4">{t('protected-renew:confirm-email.provide-email')}</p>
          <p className="mb-8">{t('protected-renew:confirm-email.verify-email')}</p>
          <p className="mb-4 italic">{t('renew:required-label')}</p>
          <div className="grid items-end gap-6 md:grid-cols-2">
            <InputField
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className="w-full"
              autoComplete="email"
              defaultValue={defaultState}
              errorMessage={errors?.email}
              label={t('protected-renew:confirm-email.email-legend')}
              maxLength={64}
              aria-describedby="adding-email"
              required
            />
          </div>
        </fieldset>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Email click">
              {t('protected-renew:confirm-email.save-btn')}
            </Button>
            <ButtonLink id="back-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Email click">
              {t('protected-renew:confirm-email.cancel-btn')}
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Email click">
              {t('protected-renew:confirm-email.continue')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/communication-preference"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Email click"
            >
              {t('protected-renew:confirm-email.back')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

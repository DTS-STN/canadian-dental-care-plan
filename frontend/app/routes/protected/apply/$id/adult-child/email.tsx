import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/email';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildState } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.email,
  pageTitleI18nKey: 'protected-apply-adult-child:email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:email.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.adult-child.email', { userId: idToken.sub });

  return {
    meta,
    defaultState: state.email,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const idToken: IdToken = session.get('idToken');
  const state = loadProtectedApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);

  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);

  const emailSchema = z
    .object({
      email: z
        .string({ error: t('protected-apply-adult-child:email.error-message.email-required') })
        .trim()
        .min(1)
        .max(64),
    })

    .superRefine((val, ctx) => {
      if (!validator.isEmail(val.email)) {
        ctx.addIssue({ code: 'custom', message: t('protected-apply-adult-child:email.error-message.email-valid'), path: ['email'] });
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
      preferredLanguage: state.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });
  }

  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.adult-child.email', { userId: idToken.sub });

  if (state.editMode) {
    // Redirect to /verify-email only if emailVerified is false
    if (isNewEmail || !state.emailVerified) {
      saveProtectedApplyState({
        params,
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
      return redirect(getPathById('protected/apply/$id/adult-child/verify-email', params));
    }
    // Save editMode data to state.
    saveProtectedApplyState({
      params,
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
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }
  saveProtectedApplyState({
    params,
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
    return redirect(getPathById('protected/apply/$id/adult-child/verify-email', params));
  }

  return redirect(getPathById('protected/apply/$id/adult-child/dental-insurance', params));
}

export default function ApplyFlowEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { email: 'email' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={62} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <p className="mb-4">{t('protected-apply-adult-child:email.provide-email')}</p>
          <p className="mb-8">{t('protected-apply-adult-child:email.verify-email')}</p>
          <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
          <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
            <InputField
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className="w-full"
              autoComplete="email"
              defaultValue={defaultState}
              errorMessage={errors?.email}
              label={t('protected-apply-adult-child:email.email-legend')}
              maxLength={64}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Save - Email click">
                {t('protected-apply-adult-child:email.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Cancel - Email click"
              >
                {t('protected-apply-adult-child:email.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Continue - Email click">
                {t('protected-apply-adult-child:email.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/adult-child/communication-preference"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Back - Email click"
              >
                {t('protected-apply-adult-child:email.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

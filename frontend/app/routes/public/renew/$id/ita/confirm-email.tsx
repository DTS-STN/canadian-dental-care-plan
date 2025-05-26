import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/confirm-email';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
} as const;

const ADD_OR_UPDATE_EMAIL_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmEmail,
  pageTitleI18nKey: 'renew-ita:confirm-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm-email.page-title') }) };

  return {
    meta,
    defaultState: {
      shouldReceiveEmailCommunication: state.contactInformation?.shouldReceiveEmailCommunication,
      email: state.contactInformation?.email,
    },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.configs.ServerConfig);

  const emailSchema = z
    .object({
      shouldReceiveEmailCommunication: z.nativeEnum(ADD_OR_UPDATE_EMAIL_OPTION, {
        errorMap: () => ({ message: t('renew-ita:confirm-email.error-message.add-or-update-required') }),
      }),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.shouldReceiveEmailCommunication === ADD_OR_UPDATE_EMAIL_OPTION.yes && !val.email) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.email-required'), path: ['email'] });
      }

      if (val.email ?? val.confirmEmail) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.email-valid'), path: ['email'] });
        }

        if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.confirm-email-required'), path: ['confirmEmail'] });
        } else if (!validator.isEmail(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.confirm-email-valid'), path: ['confirmEmail'] });
        } else if (val.email !== val.confirmEmail) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-email.error-message.email-match'), path: ['confirmEmail'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      shouldReceiveEmailCommunication: val.shouldReceiveEmailCommunication === ADD_OR_UPDATE_EMAIL_OPTION.yes,
    }));

  const parsedDataResult = emailSchema.safeParse({
    shouldReceiveEmailCommunication: formData.get('shouldReceiveEmailCommunication'),
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  if (parsedDataResult.data.email) {
    const verificationCodeService = appContainer.get(TYPES.domain.services.VerificationCodeService);
    const isNewEmail = state.contactInformation?.email !== parsedDataResult.data.email;
    const verificationCode = isNewEmail || state.verifyEmail === undefined ? verificationCodeService.createVerificationCode('anonymous') : state.verifyEmail.verificationCode;

    invariant(state.clientApplication, 'Expected clientApplication to be defined');
    if (isNewEmail) {
      await verificationCodeService.sendVerificationCodeEmail({
        email: parsedDataResult.data.email,
        verificationCode,
        preferredLanguage: state.clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
        userId: 'anonymous',
      });
    }

    if (state.editMode) {
      // Redirect to /verify-email only if emailVerified is false
      if (isNewEmail || !state.emailVerified) {
        saveRenewState({
          params,
          session,
          state: {
            editModeCommunicationPreferences: {
              email: parsedDataResult.data.email,
              shouldReceiveEmailCommunication: parsedDataResult.data.shouldReceiveEmailCommunication,
            },
            ...(isNewEmail && {
              verifyEmail: {
                verificationCode,
                verificationAttempts: 0,
              },
            }),
          },
        });
        return redirect(getPathById('public/renew/$id/ita/verify-email', params));
      }
      // Save editMode data to state.
      saveRenewState({
        params,
        session,
        state: {
          contactInformation: {
            ...state.contactInformation,
            email: parsedDataResult.data.email,
            shouldReceiveEmailCommunication: state.editModeCommunicationPreferences?.shouldReceiveEmailCommunication,
          },
          emailVerified: state.emailVerified,
          verifyEmail: {
            verificationCode,
            verificationAttempts: 0,
          },
        },
      });
      return redirect(getPathById('public/renew/$id/ita/review-information', params));
    }

    saveRenewState({
      params,
      session,
      state: {
        contactInformation: { ...state.contactInformation, ...parsedDataResult.data },
        emailVerified: isNewEmail ? false : state.emailVerified,
        ...(isNewEmail && {
          verifyEmail: {
            verificationCode,
            verificationAttempts: 0,
          },
        }),
      },
    });

    return redirect(getPathById('public/renew/$id/ita/verify-email', params));
  }

  saveRenewState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/confirm-address', params));
}

export default function RenewAdultChildConfirmEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    shouldReceiveEmailCommunication: 'input-radio-is-new-or-updated-email-option-0',
    email: 'email',
    confirmEmail: 'confirm-email',
  });

  const [shouldReceiveEmailCommunication, setshouldReceiveEmailCommunication] = useState(defaultState.shouldReceiveEmailCommunication);

  function handleNewOrUpdateEmailChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setshouldReceiveEmailCommunication(e.target.value === ADD_OR_UPDATE_EMAIL_OPTION.yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-6">
            <p className="mb-4">{t('renew-ita:confirm-email.add-or-update.help-message')}</p>
            <InputRadios
              id="is-new-or-updated-email"
              name="shouldReceiveEmailCommunication"
              legend={t('renew-ita:confirm-email.add-or-update.legend')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-ita:confirm-email.option-yes" />,
                  value: ADD_OR_UPDATE_EMAIL_OPTION.yes,
                  defaultChecked: shouldReceiveEmailCommunication === true,
                  onChange: handleNewOrUpdateEmailChanged,
                  append: shouldReceiveEmailCommunication === true && (
                    <div className="grid gap-6 md:grid-cols-2">
                      <InputField
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        className="w-full"
                        autoComplete="email"
                        defaultValue={defaultState.email}
                        errorMessage={errors?.email}
                        label={t('renew-ita:confirm-email.email')}
                        maxLength={64}
                        aria-describedby="adding-email"
                      />
                      <InputField
                        id="confirm-email"
                        name="confirmEmail"
                        type="email"
                        inputMode="email"
                        className="w-full"
                        autoComplete="email"
                        defaultValue={defaultState.email}
                        errorMessage={errors?.confirmEmail}
                        label={t('renew-ita:confirm-email.confirm-email')}
                        maxLength={64}
                        aria-describedby="adding-email"
                      />
                    </div>
                  ),
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-ita:confirm-email.option-no" />,
                  value: ADD_OR_UPDATE_EMAIL_OPTION.no,
                  defaultChecked: shouldReceiveEmailCommunication === false,
                  onChange: handleNewOrUpdateEmailChanged,
                },
              ]}
              errorMessage={errors?.shouldReceiveEmailCommunication}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Email click">
                {t('renew-ita:confirm-email.save-btn')}
              </Button>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Email click">
                {t('renew-ita:confirm-email.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FORM_ACTION.continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Email click"
              >
                {t('renew-ita:confirm-email.continue-btn')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/confirm-phone" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Email click">
                {t('renew-ita:confirm-email.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

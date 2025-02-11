import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/confirm-email';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
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
  back: 'back',
} as const;

const SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmEmail,
  pageTitleI18nKey: 'protected-renew:confirm-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  if (!state.clientApplication.isInvitationToApplyClient && !state.editMode) {
    throw new Response('Not Found', { status: 404 });
  }

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-email.page-title') }) };

  return {
    meta,
    defaultState: {
      email: state.contactInformation?.email,
      shouldReceiveEmailCommunication: state.contactInformation?.shouldReceiveEmailCommunication,
    },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    if (!state.isHomeAddressSameAsMailingAddress) {
      return redirect(getPathById('protected/renew/$id/confirm-home-address', params));
    }
    return redirect(getPathById('protected/renew/$id/confirm-address', params));
  }

  const emailSchema = z
    .object({
      shouldReceiveEmailCommunication: z.nativeEnum(SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION, {
        errorMap: () => ({ message: t('protected-renew:confirm-email.error-message.ita-add-or-update-required') }),
      }),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.shouldReceiveEmailCommunication === SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION.yes) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.email-valid'), path: ['email'] });
        }

        if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.confirm-email-required'), path: ['confirmEmail'] });
        } else if (!validator.isEmail(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.confirm-email-valid'), path: ['confirmEmail'] });
        } else if (val.email !== val.confirmEmail) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.email-match'), path: ['confirmEmail'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      shouldReceiveEmailCommunication: val.shouldReceiveEmailCommunication === SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION.yes,
    }));

  const parsedDataResult = emailSchema.safeParse({
    shouldReceiveEmailCommunication: formData.get('shouldReceiveEmailCommunication') ?? '',
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({ params, request, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/dental-insurance', params));
}

export default function ProtectedRenewProtectedConfirmEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    email: 'email',
    confirmEmail: 'confirm-email',
    shouldReceiveEmailCommunication: 'input-radio-should-receive-email-communication-option-0',
  });

  const [shouldReceiveEmailCommunication, setShouldReceiveEmailCommunication] = useState(defaultState.shouldReceiveEmailCommunication);

  function handleShouldReceiveEmailCommunicationChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setShouldReceiveEmailCommunication(e.target.value === SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION.yes);
  }

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-6">
          <p id="adding-email" className="mb-4">
            {t('protected-renew:confirm-email.add-email')}
          </p>
          <InputRadios
            id="should-receive-email-communication"
            name="shouldReceiveEmailCommunication"
            legend={t('protected-renew:confirm-email.add-or-update.legend')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:confirm-email.option-yes" />,
                value: SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION.yes,
                defaultChecked: shouldReceiveEmailCommunication === true,
                onChange: handleShouldReceiveEmailCommunicationChanged,
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
                      label={t('protected-renew:confirm-email.email')}
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
                      label={t('protected-renew:confirm-email.confirm-email')}
                      maxLength={64}
                      aria-describedby="adding-email"
                    />
                  </div>
                ),
              },
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:confirm-email.option-no" />,
                value: SHOULD_RECEIVE_EMAIL_COMMUNICATION_OPTION.no,
                defaultChecked: shouldReceiveEmailCommunication === false,
                onChange: handleShouldReceiveEmailCommunicationChanged,
              },
            ]}
            errorMessage={errors?.shouldReceiveEmailCommunication}
            required
          />
        </div>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Email click">
              {t('protected-renew:confirm-email.save-btn')}
            </Button>
            <Button id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Email click">
              {t('protected-renew:confirm-email.cancel-btn')}
            </Button>
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
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Email click"
            >
              {t('protected-renew:confirm-email.continue-btn')}
            </LoadingButton>
            <LoadingButton id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Email click">
              {t('protected-renew:confirm-email.back-btn')}
            </LoadingButton>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

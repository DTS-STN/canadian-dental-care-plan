import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
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

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

enum AddOrUpdateEmailOption {
  Yes = 'yes',
  No = 'no',
}

enum ShouldReceiveEmailCommunicationOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmEmail,
  pageTitleI18nKey: 'protected-renew:confirm-email.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-email.page-title') }) };

  return {
    id: state.id,
    csrfToken,
    meta,
    defaultState: {
      isNewOrUpdatedEmail: state.contactInformation?.isNewOrUpdatedEmail,
      email: state.contactInformation?.email,
      shouldReceiveEmailCommunication: state.contactInformation?.shouldReceiveEmailCommunication,
    },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const emailSchema = z
    .object({
      isNewOrUpdatedEmail: z.nativeEnum(AddOrUpdateEmailOption, {
        errorMap: () => ({ message: t('protected-renew:confirm-email.error-message.add-or-update-required') }),
      }),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
      shouldReceiveEmailCommunication: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.isNewOrUpdatedEmail === AddOrUpdateEmailOption.Yes) {
        if (!val.email) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.email-required'), path: ['email'] });
        }
      }

      if (val.email ?? val.confirmEmail) {
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

      if (val.isNewOrUpdatedEmail === AddOrUpdateEmailOption.Yes) {
        if (val.shouldReceiveEmailCommunication === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:confirm-email.error-message.receive-comms-required'), path: ['shouldReceiveEmailCommunication'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      isNewOrUpdatedEmail: val.isNewOrUpdatedEmail === AddOrUpdateEmailOption.Yes,
      shouldReceiveEmailCommunication: val.shouldReceiveEmailCommunication ? val.shouldReceiveEmailCommunication === ShouldReceiveEmailCommunicationOption.Yes : undefined,
    }));

  const parsedDataResult = emailSchema.safeParse({
    isNewOrUpdatedEmail: formData.get('isNewOrUpdatedEmail'),
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail')) : undefined,
    shouldReceiveEmailCommunication: formData.get('shouldReceiveEmailCommunication') ? String(formData.get('shouldReceiveEmailCommunication')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/confirm-address', params));
}

export default function ProtectedRenewConfirmEmail() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    isNewOrUpdatedEmail: 'input-radio-is-new-or-updated-email-option-0',
    email: 'email',
    confirmEmail: 'confirm-email',
    shouldReceiveEmailCommunication: 'input-radio-should-receive-email-communication-option-0',
  });

  const [isNewOrUpdatedEmail, setIsNewOrUpdatedEmail] = useState(defaultState.isNewOrUpdatedEmail);

  function handleNewOrUpdateEmailChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setIsNewOrUpdatedEmail(e.target.value === AddOrUpdateEmailOption.Yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={45} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6">
            <p id="adding-email" className="mb-4">
              {t('protected-renew:confirm-email.add-email')}
            </p>
            <InputRadios
              id="is-new-or-updated-email"
              name="isNewOrUpdatedEmail"
              legend={t('protected-renew:confirm-email.add-or-update.legend')}
              helpMessagePrimary={t('protected-renew:confirm-email.add-or-update.help-message')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:confirm-email.option-yes" />,
                  value: AddOrUpdateEmailOption.Yes,
                  defaultChecked: isNewOrUpdatedEmail === true,
                  onChange: handleNewOrUpdateEmailChanged,
                  append: isNewOrUpdatedEmail === true && (
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
                  value: AddOrUpdateEmailOption.No,
                  defaultChecked: isNewOrUpdatedEmail === false,
                  onChange: handleNewOrUpdateEmailChanged,
                },
              ]}
              errorMessage={errors?.isNewOrUpdatedEmail}
              required
            />
          </div>
          {isNewOrUpdatedEmail && (
            <div className="mb-6">
              <InputRadios
                id="should-receive-email-communication"
                name="shouldReceiveEmailCommunication"
                legend={t('protected-renew:confirm-email.receive-comms.legend')}
                options={[
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:confirm-email.option-yes" />,
                    value: ShouldReceiveEmailCommunicationOption.Yes,
                    defaultChecked: defaultState.shouldReceiveEmailCommunication === true,
                  },
                  {
                    children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:confirm-email.option-no" />,
                    value: ShouldReceiveEmailCommunicationOption.No,
                    defaultChecked: defaultState.shouldReceiveEmailCommunication === false,
                  },
                ]}
                errorMessage={errors?.shouldReceiveEmailCommunication}
                required
              />
            </div>
          )}
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Contact information click">
                {t('protected-renew:confirm-email.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Contact information click">
                {t('protected-renew:confirm-email.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Contact information click"
              >
                {t('protected-renew:confirm-email.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/confirm-phone"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Contact information click"
              >
                {t('protected-renew:confirm-email.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/communication-preference';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import type { CommunicationPreferencesState } from '~/.server/routes/helpers/apply-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const PREFERRED_NOTIFICATION_METHOD = { msca: 'msca', mail: 'mail' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.communicationPreference,
  pageTitleI18nKey: 'apply-adult-child:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const preferredLanguages = appContainer.get(TYPES.domain.services.PreferredLanguageService).listAndSortLocalizedPreferredLanguages(locale);
  const preferredCommunicationMethods = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).listAndSortLocalizedPreferredCommunicationMethods(locale);

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw data('Expected communication method email not found!', { status: 500 });
  }

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:communication-preference.page-title') }) };

  return {
    communicationMethodEmail,
    id: state.id,

    meta,
    preferredCommunicationMethods,
    preferredLanguages,
    defaultState: {
      ...(state.communicationPreferences ?? {}),
      email: state.communicationPreferences?.email ?? state.contactInformation?.email,
    },
    editMode: state.editMode,
    isReadOnlyEmail: !!state.contactInformation?.email,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const { COMMUNICATION_METHOD_EMAIL_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z
    .object({
      preferredLanguage: z.string().trim().min(1, t('apply-adult-child:communication-preference.error-message.preferred-language-required')),
      preferredMethod: z.string().trim().min(1, t('apply-adult-child:communication-preference.error-message.preferred-method-required')),
      preferredNotificationMethod: z.string().trim().min(1, t('apply-adult-child:communication-preference.error-message.preferred-notification-method-required')),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-valid'), path: ['email'] });
        }

        if (!state.contactInformation?.email) {
          if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.confirm-email-required'), path: ['confirmEmail'] });
          } else if (!validator.isEmail(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.confirm-email-valid'), path: ['confirmEmail'] });
          } else if (val.email !== val.confirmEmail) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-match'), path: ['confirmEmail'] });
          }
        }
      }
    }) satisfies z.ZodType<CommunicationPreferencesState>;

  const parsedDataResult = formSchema.safeParse({
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail') ?? '') : undefined,
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredNotificationMethod: String(formData.get('preferredNotificationMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({ params, session, state: { communicationPreferences: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  if (parsedDataResult.data.preferredMethod !== COMMUNICATION_METHOD_EMAIL_ID && parsedDataResult.data.preferredNotificationMethod === 'mail') {
    return redirect(getPathById('public/apply/$id/adult-child/dental-insurance', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/email', params));
}

export default function ApplyFlowCommunicationPreferencePage({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, defaultState, editMode, isReadOnlyEmail } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [preferredMethodValue, setPreferredMethodValue] = useState(defaultState.preferredMethod ?? '');

  const mscaLinkAccount = <InlineLink to={t('confirm.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    email: 'email',
    confirmEmail: 'confirm-email',
    preferredNotificationMethod: 'input-radio-preferred-notification-method-option-0',
  });

  const handleOnPreferredMethodChecked: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreferredMethodValue(e.target.value);
  };

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: <span className="font-bold">{t('apply-adult-child:communication-preference.by-mail')}</span>,
      value: method.id,
      defaultChecked: defaultState.preferredMethod === method.id,
      onChange: handleOnPreferredMethodChecked,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: <span className="font-bold">{t('apply-adult-child:communication-preference.by-email')}</span>,
      value: communicationMethodEmail.id,
      defaultChecked: defaultState.preferredMethod === communicationMethodEmail.id,
      append: preferredMethodValue === communicationMethodEmail.id && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField
            id="email"
            type="email"
            inputMode="email"
            className="w-full"
            label={t('apply-adult-child:communication-preference.email')}
            maxLength={64}
            name="email"
            errorMessage={errors?.email}
            autoComplete="email"
            defaultValue={defaultState.email ?? ''}
            required
            readOnly={isReadOnlyEmail}
          />
          {!isReadOnlyEmail && (
            <InputField
              id="confirm-email"
              type="email"
              inputMode="email"
              className="w-full"
              label={t('apply-adult-child:communication-preference.confirm-email')}
              maxLength={64}
              name="confirmEmail"
              errorMessage={errors?.confirmEmail}
              autoComplete="email"
              defaultValue={defaultState.email ?? ''}
              required
            />
          )}
        </div>
      ),
      onChange: handleOnPreferredMethodChecked,
    },
    ...nonEmailOptions,
  ];

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={54} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            {preferredLanguages.length > 0 && (
              <InputRadios
                id="preferred-language"
                name="preferredLanguage"
                legend={t('apply-adult-child:communication-preference.preferred-language')}
                options={preferredLanguages.map((language) => ({
                  defaultChecked: defaultState.preferredLanguage === language.id,
                  children: <span className="font-bold">{language.name}</span>,
                  value: language.id,
                }))}
                errorMessage={errors?.preferredLanguage}
                required
              />
            )}
            {preferredCommunicationMethods.length > 0 && (
              <InputRadios
                id="preferred-methods"
                legend={t('apply-adult-child:communication-preference.preferred-method')}
                helpMessagePrimary={t('apply-adult-child:communication-preference.preferred-method-help-message')}
                name="preferredMethod"
                options={options}
                errorMessage={errors?.preferredMethod}
                required
              />
            )}
            <InputRadios
              id="preferred-notification-method"
              name="preferredNotificationMethod"
              legend={t('apply-adult-child:communication-preference.preferred-notification-method')}
              options={[
                {
                  value: PREFERRED_NOTIFICATION_METHOD.msca,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:communication-preference.preferred-notification-method-msca" components={{ mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.msca,
                },
                {
                  value: PREFERRED_NOTIFICATION_METHOD.mail,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:communication-preference.preferred-notification-method-mail" components={{ mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail,
                },
              ]}
              required
              errorMessage={errors?.preferredNotificationMethod}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Communication click">
                {t('apply-adult-child:communication-preference.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Communication click"
              >
                {t('apply-adult-child:communication-preference.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Communication click">
                {t('apply-adult-child:communication-preference.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/contact-information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Communication click"
              >
                {t('apply-adult-child:communication-preference.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

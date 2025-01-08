import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmCommunicationPreference,
  pageTitleI18nKey: 'protected-renew:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { COMMUNICATION_METHOD_EMAIL_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const preferredLanguages = appContainer.get(TYPES.domain.services.PreferredLanguageService).listAndSortLocalizedPreferredLanguages(locale);
  const preferredCommunicationMethods = appContainer.get(TYPES.domain.services.PreferredCommunicationMethodService).listAndSortLocalizedPreferredCommunicationMethods(locale);

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw data('Expected communication method email not found!', { status: 500 });
  }

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:communication-preference.page-title') }) };

  return {
    communicationMethodEmail,
    id: state.id,
    meta,
    preferredCommunicationMethods,
    preferredLanguages,
    defaultState: { ...state.communicationPreferences, email: state.contactInformation?.email },
    isReadOnlyEmail: !!state.contactInformation?.email,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const { COMMUNICATION_METHOD_EMAIL_ID } = appContainer.get(TYPES.configs.ClientConfig);

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z
    .object({
      preferredLanguage: z.string().trim().min(1, t('protected-renew:communication-preference.error-message.preferred-language-required')),
      preferredMethod: z.string().trim().min(1, t('protected-renew:communication-preference.error-message.preferred-method-required')),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:communication-preference.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:communication-preference.error-message.email-valid'), path: ['email'] });
        }

        if (!state.contactInformation?.email) {
          if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:communication-preference.error-message.confirm-email-required'), path: ['confirmEmail'] });
          } else if (!validator.isEmail(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:communication-preference.error-message.confirm-email-valid'), path: ['confirmEmail'] });
          } else if (val.email !== val.confirmEmail) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-renew:communication-preference.error-message.email-match'), path: ['confirmEmail'] });
          }
        }
      }
    });

  const parsedDataResult = formSchema.safeParse({
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail') ?? '') : undefined,
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({ params, session, state: { communicationPreferences: parsedDataResult.data } });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmCommunicationPreference() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, defaultState, isReadOnlyEmail } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [preferredMethodValue, setPreferredMethodValue] = useState(defaultState.preferredMethod);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    email: 'email',
    confirmEmail: 'confirm-email',
  });

  const handleOnPreferredMethodChecked: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreferredMethodValue(e.target.value);
  };

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: method.name,
      value: method.id,
      defaultChecked: defaultState.preferredMethod === method.id,
      onChange: handleOnPreferredMethodChecked,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: communicationMethodEmail.name,
      value: communicationMethodEmail.id,
      defaultChecked: defaultState.preferredMethod === communicationMethodEmail.id,
      append: preferredMethodValue === communicationMethodEmail.id && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField
            id="email"
            type="email"
            inputMode="email"
            className="w-full"
            label={t('protected-renew:communication-preference.email')}
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
              label={t('protected-renew:communication-preference.confirm-email')}
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
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('protected-renew:communication-preference.preferred-language')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: defaultState.preferredLanguage === language.id,
                children: language.name,
                value: language.id,
              }))}
              errorMessage={errors?.preferredLanguage}
              required
            />
          )}
          {preferredCommunicationMethods.length > 0 && <InputRadios id="preferred-methods" legend={t('protected-renew:communication-preference.preferred-method')} name="preferredMethod" options={options} errorMessage={errors?.preferredMethod} required />}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Communication click">
            {t('protected-renew:communication-preference.save-btn')}
          </Button>
          <ButtonLink id="back-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Communication click">
            {t('protected-renew:communication-preference.cancel-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

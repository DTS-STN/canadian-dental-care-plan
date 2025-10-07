import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/edit-communication-preferences';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const PREFERRED_SUN_LIFE_METHOD = { email: 'email', mail: 'mail' } as const;
export const PREFERRED_NOTIFICATION_METHOD = { msca: 'msca', mail: 'mail' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.editCommunicationPreferences,
  pageTitleI18nKey: 'protected-profile:edit-communication-preferences.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:edit-communication-preferences.page-title') }) };

  const languages = appContainer.get(TYPES.LanguageService).listAndSortLocalizedLanguages(locale);

  // TODO update with correct values
  return {
    meta,
    defaultState: {
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage,
      preferredMethod: clientApplication.communicationPreferences.preferredMethod,
      preferredMethodGovernmentOfCanada: clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada,
    },
    languages,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-language-required')),
    preferredMethod: z
      .string()
      .trim()
      .min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-method-required'))
      .superRefine((val, ctx) => {
        // TODO: check if email is verified once PP has updated the clientApplication payload to include that field
        if (val === PREFERRED_SUN_LIFE_METHOD.email && clientApplication.contactInformation.email === undefined) {
          ctx.addIssue({ code: 'custom', message: t('protected-profile:edit-communication-preferences.error-message.preferred-method-email-verified') });
        }
      }),
    preferredMethodGovernmentOfCanada: z
      .string()
      .trim()
      .min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-notification-method-required'))
      .superRefine((val, ctx) => {
        // TODO: check if email is verified once PP has updated the clientApplication payload to include that field
        if (val === PREFERRED_NOTIFICATION_METHOD.msca && clientApplication.contactInformation.email === undefined) {
          ctx.addIssue({ code: 'custom', message: t('protected-profile:edit-communication-preferences.error-message.preferred-notification-method-email-verified') });
        }
      }),
  });

  const parsedDataResult = formSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredMethodGovernmentOfCanada: String(formData.get('preferredMethodGovernmentOfCanada   ') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  await appContainer.get(TYPES.ProfileService).updateCommunicationPreferences(parsedDataResult.data);

  return redirect(getPathById('protected/profile/communication-preferences', params));
}

export default function EditCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, languages } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    preferredMethodGovernmentOfCanada: 'input-radio-preferred-notification-method-option-0',
  });

  const preferredLanguageOptions: InputRadiosProps['options'] = languages.map((language) => ({
    value: language.id,
    children: language.name,
    defaultChecked: defaultState.preferredLanguage === language.id,
  }));

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputRadios id="preferred-language" name="preferredLanguage" legend={t('protected-profile:edit-communication-preferences.preferred-language')} options={preferredLanguageOptions} errorMessage={errors?.preferredLanguage} required />
          <InputRadios
            id="preferred-methods"
            legend={t('protected-profile:edit-communication-preferences.preferred-method')}
            name="preferredMethod"
            options={[
              {
                value: PREFERRED_SUN_LIFE_METHOD.email,
                children: t('protected-profile:edit-communication-preferences.by-email'),
                defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email,
              },
              {
                value: PREFERRED_SUN_LIFE_METHOD.mail,
                children: t('protected-profile:edit-communication-preferences.by-mail'),
                defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.mail,
              },
            ]}
            errorMessage={errors?.preferredMethod}
            required
          />

          <InputRadios
            id="preferred-notification-method"
            name="preferredMethodGovernmentOfCanada   "
            legend={t('protected-profile:edit-communication-preferences.preferred-notification-method')}
            options={[
              {
                value: PREFERRED_NOTIFICATION_METHOD.msca,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-communication-preferences.preferred-notification-method-msca" components={{ span: <span className="font-semibold" /> }} />,
                defaultChecked: defaultState.preferredMethodGovernmentOfCanada === PREFERRED_NOTIFICATION_METHOD.msca,
              },
              {
                value: PREFERRED_NOTIFICATION_METHOD.mail,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-communication-preferences.preferred-notification-method-mail" components={{ span: <span className="font-semibold" /> }} />,
                defaultChecked: defaultState.preferredMethodGovernmentOfCanada === PREFERRED_NOTIFICATION_METHOD.mail,
              },
            ]}
            required
            errorMessage={errors?.preferredMethodGovernmentOfCanada}
          />
        </div>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting}>
            {t('protected-profile:edit-communication-preferences.save')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/communication-preferences" params={params} disabled={isSubmitting}>
            {t('protected-profile:edit-communication-preferences.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

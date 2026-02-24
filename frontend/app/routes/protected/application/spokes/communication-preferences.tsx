import type { ReactNode } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow, CommunicationPreferencesState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'intake-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    case 'renewal-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `protected/application/$id/${applicationFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.communicationPreferences,
  pageTitleI18nKey: 'protected-application-spokes:communication-preferences.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:communication-preferences.page-title') }) };

  const languages = appContainer.get(TYPES.LanguageService).listAndSortLocalizedLanguages(locale);
  const gcCommunicationMethods = appContainer.get(TYPES.GCCommunicationMethodService).listLocalizedGCCommunicationMethods(locale);
  const sunLifeCommunicationMethods = appContainer.get(TYPES.SunLifeCommunicationMethodService).listLocalizedSunLifeCommunicationMethods(locale);
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID, COMMUNICATION_METHOD_GC_MAIL_ID } = appContainer.get(TYPES.ServerConfig);

  return {
    defaultState: state.communicationPreferences?.value,
    applicationFlow: `${state.context}-${state.typeOfApplication}` as const,
    languages,
    gcCommunicationMethods,
    sunLifeCommunicationMethods,
    COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID,
    COMMUNICATION_METHOD_GC_DIGITAL_ID,
    COMMUNICATION_METHOD_GC_MAIL_ID,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.context}-${state.typeOfApplication}`;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  // state validation schema
  const communicationPreferencesSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-application-spokes:communication-preferences.error-message.preferred-language-required')),
    preferredMethod: z.string().trim().min(1, t('protected-application-spokes:communication-preferences.error-message.preferred-method-required')),
    preferredNotificationMethod: z.string().trim().min(1, t('protected-application-spokes:communication-preferences.error-message.preferred-notification-method-required')),
  }) satisfies z.ZodType<CommunicationPreferencesState>;

  const parsedDataResult = communicationPreferencesSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredNotificationMethod: String(formData.get('preferredNotificationMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveProtectedApplicationState({
    params,
    session,
    state: {
      communicationPreferences: {
        hasChanged: true,
        value: {
          preferredLanguage: parsedDataResult.data.preferredLanguage,
          preferredMethod: parsedDataResult.data.preferredMethod,
          preferredNotificationMethod: parsedDataResult.data.preferredNotificationMethod,
        },
      },
    },
  });

  if (parsedDataResult.data.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || parsedDataResult.data.preferredNotificationMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID) {
    return redirect(getPathById('protected/application/$id/email', params));
  }
  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function ApplicationSpokeCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, applicationFlow, gcCommunicationMethods, sunLifeCommunicationMethods, COMMUNICATION_METHOD_GC_MAIL_ID, COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const mscaLinkAccount = <InlineLink to={t('protected-application-spokes:communication-preferences.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  const [preferredMethod, setPreferredMethod] = useState(defaultState?.preferredMethod ?? COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID);
  const [preferredNotification, setPreferredNotification] = useState(defaultState?.preferredNotificationMethod ?? COMMUNICATION_METHOD_GC_DIGITAL_ID);

  function handleOnPreferredMethodChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setPreferredMethod(e.target.value);
  }

  function handleOnPreferredNotificationChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setPreferredNotification(e.target.value);
  }

  const errors = fetcher.data?.errors;

  const preferredLanguageOptions: InputRadiosProps['options'] = loaderData.languages.map((language) => ({
    value: language.id,
    children: language.name,
    defaultChecked: defaultState?.preferredLanguage === language.id,
  }));

  const sunLifeCommunicationMethodOptions: InputRadiosProps['options'] = sunLifeCommunicationMethods.map((method) => {
    let children: ReactNode = method.name;

    if (method.id === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID) {
      children = <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:communication-preferences.by-email" values={{ name: method.name }} components={{ span: <span className="font-semibold" /> }} />;
    }

    return {
      value: method.id,
      children,
      defaultChecked: defaultState ? defaultState.preferredMethod === method.id : method.id === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID,
      onChange: handleOnPreferredMethodChanged,
    };
  });

  const gcCommunicationMethodOptions: InputRadiosProps['options'] = gcCommunicationMethods.map((method) => {
    let children: ReactNode = method.name;

    if (method.id === COMMUNICATION_METHOD_GC_DIGITAL_ID) {
      children = (
        <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:communication-preferences.preferred-notification-method-msca" values={{ name: method.name }} components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />
      );
    } else if (method.id === COMMUNICATION_METHOD_GC_MAIL_ID) {
      children = (
        <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:communication-preferences.preferred-notification-method-mail" values={{ name: method.name }} components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />
      );
    }

    return {
      value: method.id,
      children,
      defaultChecked: defaultState ? defaultState.preferredNotificationMethod === method.id : method.id === COMMUNICATION_METHOD_GC_DIGITAL_ID,
      onChange: handleOnPreferredNotificationChanged,
    };
  });

  return (
    <ErrorSummaryProvider actionData={fetcher.data}>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-application:required-label')}</p>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios id="preferred-language" name="preferredLanguage" legend={t('protected-application-spokes:communication-preferences.preferred-language')} options={preferredLanguageOptions} errorMessage={errors?.preferredLanguage} required />
            <InputRadios
              id="preferred-method-sunlife"
              legend={t('protected-application-spokes:communication-preferences.preferred-method')}
              name="preferredMethod"
              options={sunLifeCommunicationMethodOptions}
              errorMessage={errors?.preferredMethod}
              required
            />
            <InputRadios
              id="preferred-method-gc"
              name="preferredNotificationMethod"
              legend={t('protected-application-spokes:communication-preferences.preferred-notification-method')}
              options={gcCommunicationMethodOptions}
              required
              errorMessage={errors?.preferredNotificationMethod}
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Continue - Communication preferences click">
              {preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || preferredNotification === COMMUNICATION_METHOD_GC_DIGITAL_ID
                ? t('protected-application-spokes:communication-preferences.continue')
                : t('protected-application-spokes:communication-preferences.save')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={getRouteFromApplicationFlow(applicationFlow)}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Communication preferences click"
            >
              {t('protected-application-spokes:communication-preferences.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </ErrorSummaryProvider>
  );
}

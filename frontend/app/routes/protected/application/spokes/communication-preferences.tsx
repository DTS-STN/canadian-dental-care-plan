import type { ReactNode } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'full-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    case 'simplified-children': {
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
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family', 'simplified-adult', 'simplified-family', 'simplified-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:communication-preferences.page-title') }) };

  const languages = appContainer.get(TYPES.LanguageService).listAndSortLocalizedLanguages(locale);
  const sunLifeCommunicationMethods = appContainer.get(TYPES.SunLifeCommunicationMethodService).listLocalizedSunLifeCommunicationMethods(locale);
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID } = appContainer.get(TYPES.ServerConfig);

  return {
    defaultState: state.communicationPreferences?.value,
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}` as const,
    languages,
    sunLifeCommunicationMethods,
    COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family', 'simplified-adult', 'simplified-family', 'simplified-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.inputModel}-${state.typeOfApplication}`;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  // state validation schema
  const communicationPreferencesSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-application-spokes:communication-preferences.error-message.preferred-language-required')),
    preferredMethod: z.string().trim().min(1, t('protected-application-spokes:communication-preferences.error-message.preferred-method-required')),
  });

  const parsedDataResult = communicationPreferencesSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
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
          preferredNotificationMethod: COMMUNICATION_METHOD_GC_DIGITAL_ID,
        },
      },
    },
  });

  if (parsedDataResult.data.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID) {
    return redirect(getPathById('protected/application/$id/email', params));
  }
  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function ApplicationSpokeCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, applicationFlow, sunLifeCommunicationMethods, COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [preferredMethod, setPreferredMethod] = useState(defaultState?.preferredMethod ?? COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID);

  function handleOnPreferredMethodChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setPreferredMethod(e.target.value);
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
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Communication preferences click">
              {preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID ? t('protected-application-spokes:communication-preferences.continue') : t('protected-application-spokes:communication-preferences.save')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={getRouteFromApplicationFlow(applicationFlow)}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Communication preferences click"
            >
              {t('protected-application-spokes:communication-preferences.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </ErrorSummaryProvider>
  );
}

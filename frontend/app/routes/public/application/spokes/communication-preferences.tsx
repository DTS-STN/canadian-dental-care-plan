import type { ReactNode } from 'react';
import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import type { CommunicationPreferencesState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

function getRouteFromTypeAndFlow(typeAndFlow: string) {
  switch (typeAndFlow) {
    case 'new-children': {
      return `public/application/$id/${typeAndFlow}/parent-or-guardian`;
    }
    default: {
      return `public/application/$id/${typeAndFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.communicationPreferences,
  pageTitleI18nKey: 'application-spokes:communication-preferences.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family', 'renew-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:communication-preferences.page-title') }) };

  const languages = appContainer.get(TYPES.LanguageService).listAndSortLocalizedLanguages(locale);
  const gcCommunicationMethods = appContainer.get(TYPES.GCCommunicationMethodService).listLocalizedGCCommunicationMethods(locale);
  const sunLifeCommunicationMethods = appContainer.get(TYPES.SunLifeCommunicationMethodService).listLocalizedSunLifeCommunicationMethods(locale);
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID, COMMUNICATION_METHOD_GC_MAIL_ID } = appContainer.get(TYPES.ServerConfig);

  return {
    defaultState: state.communicationPreferences?.value,
    typeAndFlow: `${state.typeOfApplication}-${state.typeOfApplicationFlow}`,
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
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family', 'renew-adult']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const typeAndFlow = `${state.typeOfApplication}-${state.typeOfApplicationFlow}`;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  // state validation schema
  const communicationPreferencesSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('application-spokes:communication-preferences.error-message.preferred-language-required')),
    preferredMethod: z.string().trim().min(1, t('application-spokes:communication-preferences.error-message.preferred-method-required')),
    preferredNotificationMethod: z.string().trim().min(1, t('application-spokes:communication-preferences.error-message.preferred-notification-method-required')),
  }) satisfies z.ZodType<CommunicationPreferencesState>;

  const parsedDataResult = communicationPreferencesSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredNotificationMethod: String(formData.get('preferredNotificationMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({
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
    return redirect(getPathById('public/application/$id/email', params));
  }
  return redirect(getPathById(getRouteFromTypeAndFlow(typeAndFlow), params));
}

export default function ApplicationSpokeCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, typeAndFlow, gcCommunicationMethods, sunLifeCommunicationMethods, COMMUNICATION_METHOD_GC_MAIL_ID, COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const mscaLinkAccount = <InlineLink to={t('application-spokes:communication-preferences.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  const [preferredMethod, setPreferredMethod] = useState(defaultState?.preferredMethod);
  const [preferredNotification, setPreferredNotification] = useState(defaultState?.preferredNotificationMethod);

  function handleOnPreferredMethodChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setPreferredMethod(e.target.value);
  }

  function handleOnPreferredNotificationChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setPreferredNotification(e.target.value);
  }

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    preferredNotificationMethod: 'input-radio-preferred-notification-method-option-0',
  });

  const preferredLanguageOptions: InputRadiosProps['options'] = loaderData.languages.map((language) => ({
    value: language.id,
    children: language.name,
    defaultChecked: defaultState?.preferredLanguage === language.id,
  }));

  const sunLifeCommunicationMethodOptions: InputRadiosProps['options'] = sunLifeCommunicationMethods.map((method) => {
    let children: ReactNode = method.name;

    if (method.id === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID) {
      children = <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:communication-preferences.by-email" values={{ name: method.name }} components={{ span: <span className="font-semibold" /> }} />;
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
      children = <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:communication-preferences.preferred-notification-method-msca" values={{ name: method.name }} components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />;
    } else if (method.id === COMMUNICATION_METHOD_GC_MAIL_ID) {
      children = <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:communication-preferences.preferred-notification-method-mail" values={{ name: method.name }} components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />;
    }

    return {
      value: method.id,
      children,
      defaultChecked: defaultState ? defaultState.preferredNotificationMethod === method.id : method.id === COMMUNICATION_METHOD_GC_DIGITAL_ID,
      onChange: handleOnPreferredNotificationChanged,
    };
  });

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputRadios id="preferred-language" name="preferredLanguage" legend={t('application-spokes:communication-preferences.preferred-language')} options={preferredLanguageOptions} errorMessage={errors?.preferredLanguage} required />
          <InputRadios id="preferred-method-sunlife" legend={t('application-spokes:communication-preferences.preferred-method')} name="preferredMethod" options={sunLifeCommunicationMethodOptions} errorMessage={errors?.preferredMethod} required />
          <InputRadios
            id="preferred-method-gc"
            name="preferredNotificationMethod"
            legend={t('application-spokes:communication-preferences.preferred-notification-method')}
            options={gcCommunicationMethodOptions}
            required
            errorMessage={errors?.preferredNotificationMethod}
          />
        </div>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Communication preferences click">
            {(!preferredMethod && !preferredNotification) || preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || preferredNotification === COMMUNICATION_METHOD_GC_DIGITAL_ID
              ? t('application-spokes:communication-preferences.continue')
              : t('application-spokes:communication-preferences.save')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={getRouteFromTypeAndFlow(typeAndFlow)}
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Communication preferences click"
          >
            {t('application-spokes:communication-preferences.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

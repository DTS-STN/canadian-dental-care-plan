import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { data, useFetcher, useNavigate } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import type { PickDeep } from 'type-fest';
import { z } from 'zod';

import type { Route } from './+types/edit-communication-preferences';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummary } from '~/components/error-summary';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { InputRadios } from '~/components/input-radios';
import type { InputRadiosProps } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import type { ProfileEmailContext } from '~/routes/protected/profile/email';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'protected-profile:communication-preferences.page-title', routeId: 'protected/profile/communication-preferences' }],
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.editCommunicationPreferences,
  pageTitleI18nKey: 'protected-profile:edit-communication-preferences.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

function isClientApplicationEmailAddressVerified(clientApplication: PickDeep<ClientApplicationDto, 'contactInformation.email' | 'contactInformation.emailVerified'>): boolean {
  const hasEmailAddress = clientApplication.contactInformation.email !== undefined;
  const emailAddressVerified = clientApplication.contactInformation.emailVerified === true;
  return hasEmailAddress && emailAddressVerified;
}

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:edit-communication-preferences.page-title') }) };

  const languages = appContainer.get(TYPES.LanguageService).listAndSortLocalizedLanguages(locale);
  const gcCommunicationMethods = appContainer.get(TYPES.GCCommunicationMethodService).listLocalizedGCCommunicationMethods(locale);
  const sunLifeCommunicationMethods = appContainer.get(TYPES.SunLifeCommunicationMethodService).listLocalizedSunLifeCommunicationMethods(locale);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.edit-communication-preferences', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage,
      preferredMethodSunLife: COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID,
      preferredMethodGovernmentOfCanada: COMMUNICATION_METHOD_GC_DIGITAL_ID,
    },
    languages,
    gcCommunicationMethods,
    sunLifeCommunicationMethods,
    isClientApplicationEmailAddressVerified: isClientApplicationEmailAddressVerified(clientApplication),
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-language-required')),
    preferredMethodSunLife: z.string().trim().min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-method-sunlife-required')),
    preferredMethodGovernmentOfCanada: z.string().trim().min(1, t('protected-profile:edit-communication-preferences.error-message.preferred-method-gc-required')),
  });

  const parsedDataResult = formSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethodSunLife: String(formData.get('preferredMethodSunLife') ?? ''),
    preferredMethodGovernmentOfCanada: String(formData.get('preferredMethodGovernmentOfCanada') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  // Redirect to edit email address if digital communication method is selected without a verified email address
  const isDigitalCommunicationMethodSelected = parsedDataResult.data.preferredMethodSunLife === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || parsedDataResult.data.preferredMethodGovernmentOfCanada === COMMUNICATION_METHOD_GC_DIGITAL_ID;
  if (isDigitalCommunicationMethodSelected && !isClientApplicationEmailAddressVerified(clientApplication)) {
    const profileEmailContext: ProfileEmailContext = {
      context: 'communication-preferences',
      pref_lang: parsedDataResult.data.preferredLanguage,
      pref_method_sl: parsedDataResult.data.preferredMethodSunLife,
      pref_method_goc: parsedDataResult.data.preferredMethodGovernmentOfCanada,
    };

    const redirectUrl = getPathById('protected/profile/contact/email-address', params) + `?${new URLSearchParams(profileEmailContext)}`;
    return { success: true, redirectUrl, revalidate: false };
  }

  // Update communication preferences
  const idToken = session.get('idToken');

  await appContainer.get(TYPES.ProfileService).updateCommunicationPreferences(
    {
      clientId: clientApplication.applicantInformation.clientId,
      preferredLanguage: parsedDataResult.data.preferredLanguage,
      preferredMethodSunLife: parsedDataResult.data.preferredMethodSunLife,
      preferredMethodGovernmentOfCanada: parsedDataResult.data.preferredMethodGovernmentOfCanada,
    },
    idToken.sub,
  );

  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.edit-communication-preferences', { userId: idToken.sub });

  const redirectUrl = getPathById('protected/profile/communication-preferences', params);
  return { success: true, redirectUrl, revalidate: false };
}

export default function EditCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, languages, sunLifeCommunicationMethods, gcCommunicationMethods, isClientApplicationEmailAddressVerified } = loaderData;
  const { COMMUNICATION_METHOD_GC_DIGITAL_ID, COMMUNICATION_METHOD_GC_MAIL_ID, COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID } = useClientEnv();

  const [selectedPreferredMethodSunLife, setSelectedPreferredMethodSunLife] = useState(defaultState.preferredMethodSunLife);
  const [selectedPreferredMethodGovernmentOfCanada, setSelectedPreferredMethodGovernmentOfCanada] = useState(defaultState.preferredMethodGovernmentOfCanada);

  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);
  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const success = fetcher.data && 'success' in fetcher.data && fetcher.data.success === true;
  const redirectUrl = fetcher.data && 'redirectUrl' in fetcher.data ? fetcher.data.redirectUrl : undefined;

  // Consider the form to be in a submitting or successful state if it's currently being submitted or if it has been
  // successfully submitted to prevent multiple submissions and navigating away from the page while the form is being submitted
  const isSubmittingOrSuccess = isSubmitting || success === true;

  useEffect(() => {
    // Only navigate when the form has been successfully submitted to avoid interrupting ongoing navigations or navigating
    // away while the form is being submitted
    if (!isSubmitting && success && redirectUrl) {
      // Push form submit event to Adobe Analytics with form values when the form is successfully submitted
      if (adobeAnalytics.isConfigured()) {
        const formName = 'ESDC-EDSC:CDCP Communication preferences in MSCA profile';
        const formValues = new Map<string, { elementType: 'radio'; value: string }>();

        function getCheckedValue(name: string, fieldId: string) {
          const selectedEl = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
          if (selectedEl) {
            formValues.set(fieldId, {
              elementType: 'radio',
              value: selectedEl.attributes.getNamedItem('data-gc-analytics-value')?.value ?? selectedEl.value,
            });
          }
        }

        getCheckedValue('preferredLanguage', 'preferred-language');
        getCheckedValue('preferredMethodSunLife', 'preferred-method-sunlife');
        getCheckedValue('preferredMethodGovernmentOfCanada', 'preferred-method-government-of-canada');

        adobeAnalytics.pushFormSubmitEvent(formName, formValues);
      }

      void navigate(redirectUrl);
    }
  }, [isSubmitting, navigate, redirectUrl, success]);

  const preferredLanguageOptions: InputRadiosProps['options'] = languages.map((language) => ({
    value: language.id,
    children: language.name,
    defaultChecked: defaultState.preferredLanguage === language.id,
    'data-gc-analytics-value': language.code,
  }));

  const sunLifeCommunicationMethodOptions: InputRadiosProps['options'] = sunLifeCommunicationMethods.map((method) => ({
    value: method.id,
    children: <span className="font-semibold">{method.name}</span>,
    defaultChecked: selectedPreferredMethodSunLife === method.id,
    onChange: (e) => setSelectedPreferredMethodSunLife(e.target.value),
    'data-gc-analytics-value': method.code,
  }));

  const gcCommunicationMethodOptions: InputRadiosProps['options'] = gcCommunicationMethods.map((method) => {
    let children: ReactNode = <span className="font-semibold">{method.name}</span>;

    if (method.id === COMMUNICATION_METHOD_GC_DIGITAL_ID) {
      children = <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-communication-preferences.preferred-method-gc-digital" values={{ name: method.name }} components={{ span: <span className="font-semibold" /> }} />;
    } else if (method.id === COMMUNICATION_METHOD_GC_MAIL_ID) {
      children = <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:edit-communication-preferences.preferred-method-gc-mail" values={{ name: method.name }} components={{ span: <span className="font-semibold" /> }} />;
    }

    return {
      value: method.id,
      children,
      defaultChecked: selectedPreferredMethodGovernmentOfCanada === method.id,
      onChange: (e) => setSelectedPreferredMethodGovernmentOfCanada(e.target.value),
      'data-gc-analytics-value': method.code,
    };
  });

  const isDigitalCommunicationMethodSelected = selectedPreferredMethodSunLife === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || selectedPreferredMethodGovernmentOfCanada === COMMUNICATION_METHOD_GC_DIGITAL_ID;
  const submitButtonText = isDigitalCommunicationMethodSelected && !isClientApplicationEmailAddressVerified ? t('protected-profile:edit-communication-preferences.continue') : t('protected-profile:edit-communication-preferences.save');

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios id="preferred-language" name="preferredLanguage" legend={t('protected-profile:edit-communication-preferences.preferred-language')} options={preferredLanguageOptions} errorMessage={errors?.preferredLanguage} required />
            <InputRadios
              id="preferred-method-sunlife"
              legend={t('protected-profile:edit-communication-preferences.preferred-method-sunlife')}
              name="preferredMethodSunLife"
              options={sunLifeCommunicationMethodOptions}
              errorMessage={errors?.preferredMethodSunLife}
              required
            />
            <InputRadios
              id="preferred-method-gc"
              name="preferredMethodGovernmentOfCanada"
              legend={t('protected-profile:edit-communication-preferences.preferred-method-gc')}
              options={gcCommunicationMethodOptions}
              required
              errorMessage={errors?.preferredMethodGovernmentOfCanada}
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="save-button" loading={isSubmittingOrSuccess} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Save - Communication preferences click">
              {submitButtonText}
            </LoadingButton>
            <ButtonLink
              variant="secondary"
              id="back-button"
              routeId="protected/profile/communication-preferences"
              params={params}
              disabled={isSubmittingOrSuccess}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Communication preferences click"
            >
              {t('protected-profile:edit-communication-preferences.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}

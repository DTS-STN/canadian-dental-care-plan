import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/communication-preference';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyChildState } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import type { CommunicationPreferencesState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const PREFERRED_SUN_LIFE_METHOD = { email: 'email', mail: 'mail' } as const;
export const PREFERRED_NOTIFICATION_METHOD = { msca: 'msca', mail: 'mail' } as const;
export const PREFERRED_LANGUAGE = { english: 'english', french: 'french' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.communicationPreference,
  pageTitleI18nKey: 'protected-apply-child:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-child:communication-preference.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.child.communication-preference', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      ...state.communicationPreferences,
    },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-apply-child:communication-preference.error-message.preferred-language-required')),
    preferredMethod: z.string().trim().min(1, t('protected-apply-child:communication-preference.error-message.preferred-method-required')),
    preferredNotificationMethod: z.string().trim().min(1, t('protected-apply-child:communication-preference.error-message.preferred-notification-method-required')),
  }) satisfies z.ZodType<CommunicationPreferencesState>;

  const parsedDataResult = formSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredNotificationMethod: String(formData.get('preferredNotificationMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.child.communication-preference', { userId: idToken.sub });

  if (state.editMode) {
    if (parsedDataResult.data.preferredMethod !== PREFERRED_SUN_LIFE_METHOD.email && parsedDataResult.data.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail) {
      saveProtectedApplyState({ params, session, state: { communicationPreferences: parsedDataResult.data, email: undefined, emailVerified: undefined } });
      return redirect(getPathById('protected/apply/$id/child/review-adult-information', params));
    }
    saveProtectedApplyState({ params, session, state: { editModeCommunicationPreferences: parsedDataResult.data } });
    return redirect(getPathById('protected/apply/$id/child/email', params));
  }

  if (parsedDataResult.data.preferredMethod !== PREFERRED_SUN_LIFE_METHOD.email && parsedDataResult.data.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail) {
    saveProtectedApplyState({ params, session, state: { communicationPreferences: parsedDataResult.data, email: undefined, emailVerified: undefined } });
    return redirect(getPathById('protected/apply/$id/child/review-child-information', params));
  }
  saveProtectedApplyState({ params, session, state: { communicationPreferences: parsedDataResult.data } });
  return redirect(getPathById('protected/apply/$id/child/email', params));
}

export default function ApplyFlowCommunicationPreferencePage({ loaderData, params }: Route.ComponentProps) {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const mscaLinkAccount = <InlineLink to={t('communication-preference.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    preferredNotificationMethod: 'input-radio-preferred-notification-method-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={80} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('protected-apply-child:communication-preference.preferred-language')}
              options={
                i18n.language === 'fr'
                  ? [
                      {
                        value: PREFERRED_LANGUAGE.french,
                        children: t('protected-apply-child:communication-preference.french'),
                        defaultChecked: defaultState.preferredLanguage === PREFERRED_LANGUAGE.french,
                      },
                      {
                        value: PREFERRED_LANGUAGE.english,
                        children: t('protected-apply-child:communication-preference.english'),
                        defaultChecked: defaultState.preferredLanguage === PREFERRED_LANGUAGE.english,
                      },
                    ]
                  : [
                      {
                        value: PREFERRED_LANGUAGE.english,
                        children: t('protected-apply-child:communication-preference.english'),
                        defaultChecked: defaultState.preferredLanguage === PREFERRED_LANGUAGE.english,
                      },
                      {
                        value: PREFERRED_LANGUAGE.french,
                        children: t('protected-apply-child:communication-preference.french'),
                        defaultChecked: defaultState.preferredLanguage === PREFERRED_LANGUAGE.french,
                      },
                    ]
              }
              errorMessage={errors?.preferredLanguage}
              required
            />
            <InputRadios
              id="preferred-methods"
              legend={t('protected-apply-child:communication-preference.preferred-method')}
              helpMessagePrimary={t('protected-apply-child:communication-preference.preferred-method-help-message')}
              name="preferredMethod"
              options={[
                {
                  value: PREFERRED_SUN_LIFE_METHOD.email,
                  children: t('protected-apply-child:communication-preference.by-email'),
                  defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email,
                },
                {
                  value: PREFERRED_SUN_LIFE_METHOD.mail,
                  children: t('protected-apply-child:communication-preference.by-mail'),
                  defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.mail,
                },
              ]}
              errorMessage={errors?.preferredMethod}
              required
            />

            <InputRadios
              id="preferred-notification-method"
              name="preferredNotificationMethod"
              legend={t('protected-apply-child:communication-preference.preferred-notification-method')}
              options={[
                {
                  value: PREFERRED_NOTIFICATION_METHOD.msca,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:communication-preference.preferred-notification-method-msca" components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.msca,
                },
                {
                  value: PREFERRED_NOTIFICATION_METHOD.mail,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:communication-preference.preferred-notification-method-mail" components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail,
                },
              ]}
              required
              errorMessage={errors?.preferredNotificationMethod}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Save - Communication preference click">
                {t('protected-apply-child:communication-preference.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Cancel - Communication preference click"
              >
                {t('protected-apply-child:communication-preference.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Continue - Communication click">
                {t('protected-apply-child:communication-preference.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/child/phone-number"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Back - Communication click"
              >
                {t('protected-apply-child:communication-preference.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/communication-preference';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import type { CommunicationPreferencesState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.communicationPreference,
  pageTitleI18nKey: 'renew-ita:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:communication-preference.page-title') }) };

  return {
    meta,
    defaultState: { ...state.communicationPreferences },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    preferredMethod: z.string().trim().min(1, t('renew-ita:communication-preference.error-message.preferred-method-required')),
    preferredNotificationMethod: z.string().trim().min(1, t('renew-ita:communication-preference.error-message.preferred-notification-method-required')),
  }) satisfies z.ZodType<CommunicationPreferencesState>;

  const parsedDataResult = formSchema.safeParse({
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
    preferredNotificationMethod: String(formData.get('preferredNotificationMethod') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  if (state.editMode) {
    if (parsedDataResult.data.preferredMethod !== PREFERRED_SUN_LIFE_METHOD.email && parsedDataResult.data.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail) {
      saveRenewState({ params, session, state: { communicationPreferences: parsedDataResult.data, email: undefined, emailVerified: undefined } });
      return redirect(getPathById('public/renew/$id/ita/review-information', params));
    }
    saveRenewState({ params, session, state: { editModeCommunicationPreferences: parsedDataResult.data } });
    return redirect(getPathById('public/renew/$id/ita/confirm-email', params));
  }

  if (parsedDataResult.data.preferredMethod !== PREFERRED_SUN_LIFE_METHOD.email && parsedDataResult.data.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail) {
    saveRenewState({
      params,
      session,
      state: {
        communicationPreferences: parsedDataResult.data,
        email: undefined,
        emailVerified: undefined,
      },
    });
    return redirect(getPathById('public/renew/$id/ita/confirm-address', params));
  }
  saveRenewState({
    params,
    session,
    state: {
      communicationPreferences: parsedDataResult.data,
    },
  });
  return redirect(getPathById('public/renew/$id/ita/confirm-email', params));
}

export default function RenewFlowCommunicationPreferencePage({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const mscaLinkAccount = <InlineLink to={t('communication-preference.msca-link-account')} className="external-link" newTabIndicator target="_blank" />;

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredMethod: 'input-radio-preferred-methods-option-0',
    preferredNotificationMethod: 'input-radio-preferred-notification-method-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios
              id="preferred-methods"
              legend={t('renew-ita:communication-preference.preferred-method')}
              name="preferredMethod"
              options={[
                {
                  value: PREFERRED_SUN_LIFE_METHOD.email,
                  children: t('renew-ita:communication-preference.by-email'),
                  defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email,
                },
                {
                  value: PREFERRED_SUN_LIFE_METHOD.mail,
                  children: t('renew-ita:communication-preference.by-mail'),
                  defaultChecked: defaultState.preferredMethod === PREFERRED_SUN_LIFE_METHOD.mail,
                },
              ]}
              errorMessage={errors?.preferredMethod}
              required
            />

            <InputRadios
              id="preferred-notification-method"
              name="preferredNotificationMethod"
              legend={t('renew-ita:communication-preference.preferred-notification-method')}
              options={[
                {
                  value: PREFERRED_NOTIFICATION_METHOD.msca,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-ita:communication-preference.preferred-notification-method-msca" components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.msca,
                },
                {
                  value: PREFERRED_NOTIFICATION_METHOD.mail,
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-ita:communication-preference.preferred-notification-method-mail" components={{ span: <span className="font-semibold" />, mscaLinkAccount }} />,
                  defaultChecked: defaultState.preferredNotificationMethod === PREFERRED_NOTIFICATION_METHOD.mail,
                },
              ]}
              required
              errorMessage={errors?.preferredNotificationMethod}
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Communication click">
                {t('renew-ita:communication-preference.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Communication click">
                {t('renew-ita:communication-preference.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Communication click">
                {t('renew-ita:communication-preference.continue')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/confirm-phone" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Communication click">
                {t('renew-ita:communication-preference.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-communication-preference';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const PREFERRED_LANGUAGE = { english: 'english', french: 'french' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmCommunicationPreference,
  pageTitleI18nKey: 'protected-renew:confirm-communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-communication-preference.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.confirm-communication-preference', { userId: idToken.sub });

  return {
    meta,
    defaultState: state.preferredLanguage ?? state.clientApplication.communicationPreferences.preferredLanguage,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z.object({
    preferredLanguage: z.string().trim().min(1, t('protected-renew:confirm-communication-preference.error-message.preferred-language-required')),
  });

  const parsedDataResult = formSchema.safeParse({
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: { preferredLanguage: parsedDataResult.data.preferredLanguage },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.confirm-communication-preference', { userId: idToken.sub });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmCommunicationPreference({ loaderData, params }: Route.ComponentProps) {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
  });

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputRadios
            id="preferred-language"
            name="preferredLanguage"
            legend={t('protected-renew:confirm-communication-preference.preferred-language')}
            options={
              i18n.language === 'fr'
                ? [
                    {
                      value: PREFERRED_LANGUAGE.french,
                      children: t('protected-renew:confirm-communication-preference.french'),
                      defaultChecked: defaultState === PREFERRED_LANGUAGE.french,
                    },
                    {
                      value: PREFERRED_LANGUAGE.english,
                      children: t('protected-renew:confirm-communication-preference.english'),
                      defaultChecked: defaultState === PREFERRED_LANGUAGE.english,
                    },
                  ]
                : [
                    {
                      value: PREFERRED_LANGUAGE.english,
                      children: t('protected-renew:confirm-communication-preference.english'),
                      defaultChecked: defaultState === PREFERRED_LANGUAGE.english,
                    },
                    {
                      value: PREFERRED_LANGUAGE.french,
                      children: t('protected-renew:confirm-communication-preference.french'),
                      defaultChecked: defaultState === PREFERRED_LANGUAGE.french,
                    },
                  ]
            }
            errorMessage={errors?.preferredLanguage}
            required
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Communication click">
            {t('protected-renew:confirm-communication-preference.save-btn')}
          </Button>
          <ButtonLink id="back-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Communication click">
            {t('protected-renew:confirm-communication-preference.cancel-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

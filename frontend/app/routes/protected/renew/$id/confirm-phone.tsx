import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-phone';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { phoneSchema } from '~/.server/validation/phone-schema';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputPhoneField } from '~/components/input-phone-field';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  cancel: 'cancel',
  save: 'save',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmPhone,
  pageTitleI18nKey: 'protected-renew:confirm-phone.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-phone.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.confirm-phone', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z.object({
    phoneNumber: phoneSchema({
      invalid_phone_canadian_error: t('protected-renew:confirm-phone.error-message.phone-number-valid'),
      invalid_phone_international_error: t('protected-renew:confirm-phone.error-message.phone-number-valid-international'),
    }).optional(),
    phoneNumberAlt: phoneSchema({
      invalid_phone_canadian_error: t('protected-renew:confirm-phone.error-message.phone-number-alt-valid'),
      invalid_phone_international_error: t('protected-renew:confirm-phone.error-message.phone-number-alt-valid-international'),
    }).optional(),
  });

  const parsedDataResult = phoneNumberSchema.safeParse({
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.confirm-phone', { userId: idToken.sub });

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewConfirmPhone({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:all-optional-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-6">
          <div className="grid items-end gap-6">
            <InputPhoneField
              id="phone-number"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumber ?? ''}
              errorMessage={errors?.phoneNumber}
              label={t('protected-renew:confirm-phone.phone-number')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
            <InputPhoneField
              id="phone-number-alt"
              name="phoneNumberAlt"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumberAlt ?? ''}
              errorMessage={errors?.phoneNumberAlt}
              label={t('protected-renew:confirm-phone.phone-number-alt')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Phone Number click">
            {t('protected-renew:confirm-phone.save-btn')}
          </Button>
          <ButtonLink id="cancel-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Phone Number click">
            {t('protected-renew:confirm-phone.cancel-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

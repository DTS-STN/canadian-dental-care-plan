import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Cancel = 'cancel',
  Save = 'save',
}

enum AddressRadioOptions {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmAddress,
  pageTitleI18nKey: 'protected-renew:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  if (!state.clientApplication.isInvitationToApplyClient && !state.editMode) {
    throw new Response('Not Found', { status: 404 });
  }

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-address.page-title') }) };

  return { id: state.id, meta, defaultState: { isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    isHomeAddressSameAsMailingAddress: z.nativeEnum(AddressRadioOptions, { errorMap: () => ({ message: t('protected-renew:confirm-address.error-message.is-home-address-same-as-mailing-address-required') }) }),
  });

  const parsedDataResult = confirmAddressSchema.safeParse({
    isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.isHomeAddressSameAsMailingAddress === AddressRadioOptions.Yes,
    },
  });

  if (parsedDataResult.data.isHomeAddressSameAsMailingAddress === AddressRadioOptions.No) {
    return redirect(getPathById('protected/renew/$id/confirm-home-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/confirm-email', params));
}

export default function ProtectedRenewProtectedConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    isHomeAddressSameAsMailingAddress: 'input-radio-is-home-address-same-as-mailing-address-option-0',
  });

  return (
    <div className="max-w-prose">
      <p className="Protectedlic mb-4">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="space-y-6">
          <InputRadios
            id="is-home-address-same-as-mailing-address"
            name="isHomeAddressSameAsMailingAddress"
            legend={t('protected-renew:confirm-address.is-home-address-same-as-mailing-address')}
            options={[
              { value: AddressRadioOptions.Yes, children: t('protected-renew:confirm-address.radio-options.yes'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === true },
              { value: AddressRadioOptions.No, children: t('protected-renew:confirm-address.radio-options.no'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === false },
            ]}
            errorMessage={errors?.isHomeAddressSameAsMailingAddress}
            required
          />
        </div>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <LoadingButton id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Confirm address click">
              {t('protected-renew:confirm-address.save-btn')}
            </LoadingButton>
            <ButtonLink id="cancel-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Confirm address click">
              {t('protected-renew:confirm-address.cancel-btn')}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Address click">
              {t('protected-renew:confirm-address.continue-btn')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="protected/renew/$id/confirm-email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Address click">
              {t('protected-renew:confirm-address.back-btn')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

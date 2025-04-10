import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-address';

import { TYPES } from '~/.server/constants';
import { isInvitationToApplyClient, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
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
import { formatAddressLine } from '~/utils/string-utils';

const FORM_ACTION = {
  cancel: 'cancel',
  save: 'save',
} as const;

const ADDRESS_RADIO_OPTIONS = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmAddress,
  pageTitleI18nKey: 'protected-renew:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  if (!isInvitationToApplyClient(state.clientApplication) && !state.editMode) {
    instrumentationService.countHttpStatus('protected.renew.confirm-address', 404);
    throw new Response('Not Found', { status: 404 });
  }

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-address.page-title') }) };

  instrumentationService.countHttpStatus('protected.renew.confirm-address', 200);
  return { id: state.id, meta, defaultState: { isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    isHomeAddressSameAsMailingAddress: z.nativeEnum(ADDRESS_RADIO_OPTIONS, { errorMap: () => ({ message: t('protected-renew:confirm-address.error-message.is-home-address-same-as-mailing-address-required') }) }),
  });

  const parsedDataResult = confirmAddressSchema.safeParse({
    isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ?? '',
  });

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('protected.renew.confirm-address', 400);
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const homeAddress =
    parsedDataResult.data.isHomeAddressSameAsMailingAddress === ADDRESS_RADIO_OPTIONS.yes
      ? (state.mailingAddress ?? {
          address: formatAddressLine({ address: state.clientApplication.contactInformation.mailingAddress, apartment: state.clientApplication.contactInformation.mailingApartment }),
          country: state.clientApplication.contactInformation.mailingCountry,
          province: state.clientApplication.contactInformation.mailingProvince,
          city: state.clientApplication.contactInformation.mailingCity,
          postalCode: state.clientApplication.contactInformation.mailingPostalCode,
        })
      : undefined;

  saveProtectedRenewState({
    params,
    request,
    session,
    state: {
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.isHomeAddressSameAsMailingAddress === ADDRESS_RADIO_OPTIONS.yes,
      homeAddress,
    },
  });

  instrumentationService.countHttpStatus('protected.renew.confirm-address', 302);

  if (parsedDataResult.data.isHomeAddressSameAsMailingAddress === ADDRESS_RADIO_OPTIONS.no) {
    return redirect(getPathById('protected/renew/$id/confirm-home-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/ita/confirm-email', params));
}

export default function ProtectedRenewProtectedConfirmAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

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
              { value: ADDRESS_RADIO_OPTIONS.yes, children: t('protected-renew:confirm-address.radio-options.yes'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === true },
              { value: ADDRESS_RADIO_OPTIONS.no, children: t('protected-renew:confirm-address.radio-options.no'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === false },
            ]}
            errorMessage={errors?.isHomeAddressSameAsMailingAddress}
            required
          />
        </div>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <LoadingButton id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Confirm address click">
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
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/confirm-marital-status"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Address click"
            >
              {t('protected-renew:confirm-address.back-btn')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

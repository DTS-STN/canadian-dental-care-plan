import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-address';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  save: 'save',
} as const;

const ADDRESS_RADIO_OPTIONS = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmAddress,
  pageTitleI18nKey: 'renew-ita:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm-address.page-title') }) };

  invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
  const backToEmail = state.communicationPreferences.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email || state.communicationPreferences.preferredNotificationMethod !== PREFERRED_NOTIFICATION_METHOD.mail;

  return { meta, defaultState: { hasAddressChanged: state.hasAddressChanged, isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress }, backToEmail, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z
    .object({
      hasAddressChanged: z.boolean({ error: t('renew-ita:confirm-address.error-message.has-address-changed-required') }),
      isHomeAddressSameAsMailingAddress: z.boolean().optional(),
    })

    .superRefine((val, ctx) => {
      if (!val.hasAddressChanged && val.isHomeAddressSameAsMailingAddress === undefined) {
        ctx.addIssue({ code: 'custom', message: t('renew-ita:confirm-address.error-message.is-home-address-same-as-mailing-address-required'), path: ['isHomeAddressSameAsMailingAddress'] });
      }
    });

  const parsedDataResult = confirmAddressSchema.safeParse({
    hasAddressChanged: formData.get('hasAddressChanged') ? String(formData.get('hasAddressChanged')) === ADDRESS_RADIO_OPTIONS.yes : undefined,
    isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ? String(formData.get('isHomeAddressSameAsMailingAddress')) === ADDRESS_RADIO_OPTIONS.yes : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      mailingAddress: parsedDataResult.data.hasAddressChanged ? state.mailingAddress : undefined,
      homeAddress: parsedDataResult.data.isHomeAddressSameAsMailingAddress ? undefined : state.homeAddress,
      hasAddressChanged: parsedDataResult.data.hasAddressChanged,
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.hasAddressChanged ? undefined : parsedDataResult.data.isHomeAddressSameAsMailingAddress,
      previousAddressState: {
        hasAddressChanged: state.hasAddressChanged,
        isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress,
      },
    },
  });

  if (parsedDataResult.data.hasAddressChanged) {
    return redirect(getPathById('public/renew/$id/ita/update-mailing-address', params));
  }

  if (!parsedDataResult.data.isHomeAddressSameAsMailingAddress) {
    return redirect(getPathById('public/renew/$id/ita/update-home-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }
  return redirect(getPathById('public/renew/$id/ita/dental-insurance', params));
}

export default function RenewItaConfirmAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, backToEmail, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
    isHomeAddressSameAsMailingAddress: 'input-radio-is-home-address-same-as-mailing-address-option-0',
  });

  const [hasAddressChangedRadioValue, setHasAddressChangeRadioValue] = useState(defaultState.hasAddressChanged);

  function handleHasAddressChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasAddressChangeRadioValue(e.target.value === ADDRESS_RADIO_OPTIONS.yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={66} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="space-y-6">
            <InputRadios
              id="has-address-changed"
              name="hasAddressChanged"
              legend={t('renew-ita:confirm-address.have-you-moved')}
              options={[
                { value: ADDRESS_RADIO_OPTIONS.yes, children: t('renew-ita:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true, onChange: handleHasAddressChanged },
                { value: ADDRESS_RADIO_OPTIONS.no, children: t('renew-ita:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false, onChange: handleHasAddressChanged },
              ]}
              helpMessagePrimary={t('renew-ita:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
            {hasAddressChangedRadioValue === false && (
              <InputRadios
                id="is-home-address-same-as-mailing-address"
                name="isHomeAddressSameAsMailingAddress"
                legend={t('renew-ita:confirm-address.is-home-address-same-as-mailing-address')}
                options={[
                  { value: ADDRESS_RADIO_OPTIONS.yes, children: t('renew-ita:confirm-address.radio-options.yes'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === true },
                  { value: ADDRESS_RADIO_OPTIONS.no, children: t('renew-ita:confirm-address.radio-options.no'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === false },
                ]}
                errorMessage={errors?.isHomeAddressSameAsMailingAddress}
                required
              />
            )}
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LoadingButton id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Address click">
                {t('renew-ita:confirm-address.save-btn')}
              </LoadingButton>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/ita/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Address click">
                {t('renew-ita:confirm-address.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Address click">
                {t('renew-ita:confirm-address.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={backToEmail ? 'public/renew/$id/ita/confirm-email' : 'public/renew/$id/ita/communication-preference'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Address click"
              >
                {t('renew-ita:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

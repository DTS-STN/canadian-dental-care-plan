import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

enum AddressRadioOptions {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmAddress,
  pageTitleI18nKey: 'renew-ita:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm-address.page-title') }) };

  return { id: state.id, meta, defaultState: { hasAddressChanged: state.hasAddressChanged, isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z
    .object({
      hasAddressChanged: z.nativeEnum(AddressRadioOptions, {
        errorMap: () => ({ message: t('renew-ita:confirm-address.error-message.has-address-changed-required') }),
      }),
      isHomeAddressSameAsMailingAddress: z.nativeEnum(AddressRadioOptions).or(z.literal('')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasAddressChanged === AddressRadioOptions.No) {
        if (!val.isHomeAddressSameAsMailingAddress) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:confirm-address.error-message.is-home-address-same-as-mailing-address-required'), path: ['isHomeAddressSameAsMailingAddress'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      isHomeAddressSameAsMailingAddress: val.isHomeAddressSameAsMailingAddress ? val.isHomeAddressSameAsMailingAddress : undefined,
    }));

  const parsedDataResult = confirmAddressSchema.safeParse({
    hasAddressChanged: formData.get('hasAddressChanged'),
    isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      hasAddressChanged: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes,
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No ? parsedDataResult.data.isHomeAddressSameAsMailingAddress === AddressRadioOptions.Yes : undefined,
    },
  });

  if (parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No) {
    if (parsedDataResult.data.isHomeAddressSameAsMailingAddress === AddressRadioOptions.No) {
      return redirect(getPathById('public/renew/$id/ita/update-home-address', params));
    }
    return redirect(getPathById('public/renew/$id/ita/dental-insurance', params));
  }

  return redirect(getPathById('public/renew/$id/ita/update-mailing-address', params));
}

export default function RenewItaConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
    isHomeAddressSameAsMailingAddress: 'input-radio-is-home-address-same-as-mailing-address-option-0',
  });

  const [hasAddressChangedRadioValue, setHasAddressChangeRadioValue] = useState(defaultState.hasAddressChanged);

  function handleHasAddressChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasAddressChangeRadioValue(e.target.value === AddressRadioOptions.Yes);
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
                { value: AddressRadioOptions.Yes, children: t('renew-ita:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true, onChange: handleHasAddressChanged },
                { value: AddressRadioOptions.No, children: t('renew-ita:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false, onChange: handleHasAddressChanged },
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
                  { value: AddressRadioOptions.Yes, children: t('renew-ita:confirm-address.radio-options.yes'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === true },
                  { value: AddressRadioOptions.No, children: t('renew-ita:confirm-address.radio-options.no'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === false },
                ]}
                errorMessage={errors?.isHomeAddressSameAsMailingAddress}
                required
              />
            )}
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LoadingButton id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Address click">
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
              <ButtonLink id="back-button" routeId="public/renew/$id/ita/confirm-email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Address click">
                {t('renew-ita:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

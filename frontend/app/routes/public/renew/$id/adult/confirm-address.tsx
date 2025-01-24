import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-address';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultState } from '~/.server/routes/helpers/renew-adult-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeRouteModuleMeta } from '~/utils/meta-utils';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adult.confirmAddress,
  pageTitleI18nKey: 'renew-adult:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeRouteModuleMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult:confirm-address.page-title') }) };

  return { id: state.id, meta, defaultState: { hasAddressChanged: state.hasAddressChanged }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    hasAddressChanged: z.nativeEnum(AddressRadioOptions, {
      errorMap: () => ({ message: t('renew-adult:confirm-address.error-message.has-address-changed-required') }),
    }),
  });

  const parsedDataResult = confirmAddressSchema.safeParse({
    hasAddressChanged: formData.get('hasAddressChanged'),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      hasAddressChanged: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes,
      homeAddress: state.editMode && parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No ? undefined : state.homeAddress,
      mailingAddress: state.editMode && parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No ? undefined : state.mailingAddress,
    },
  });

  if (parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes) {
    return redirect(getPathById('public/renew/$id/adult/update-mailing-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult/review-adult-information', params));
  }
  return redirect(getPathById('public/renew/$id/adult/dental-insurance', params));
}

export default function RenewAdultConfirmAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
  });

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
              legend={t('renew-adult:confirm-address.have-you-moved')}
              options={[
                { value: AddressRadioOptions.Yes, children: t('renew-adult:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true },
                { value: AddressRadioOptions.No, children: t('renew-adult:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false },
              ]}
              helpMessagePrimary={t('renew-adult:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Address click">
                {t('renew-adult:confirm-address.save-btn')}
              </Button>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/adult/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Address click">
                {t('renew-adult:confirm-address.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Address click">
                {t('renew-adult:confirm-address.continue-btn')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/renew/$id/adult/confirm-email" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Address click">
                {t('renew-adult:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmAddress,
  pageTitleI18nKey: 'renew-adult-child:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-address.page-title') }) };

  return { id: state.id, meta, defaultState: { hasAddressChanged: state.hasAddressChanged }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    hasAddressChanged: z.nativeEnum(AddressRadioOptions, {
      errorMap: () => ({ message: t('renew-adult-child:confirm-address.error-message.has-address-changed-required') }),
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
    return redirect(getPathById('public/renew/$id/adult-child/update-mailing-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }
  return redirect(getPathById('public/renew/$id/adult-child/dental-insurance', params));
}

export default function RenewAdultChildConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('renew:progress.label')} />
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
              legend={t('renew-adult-child:confirm-address.have-you-moved')}
              options={[
                { value: AddressRadioOptions.Yes, children: t('renew-adult-child:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true },
                { value: AddressRadioOptions.No, children: t('renew-adult-child:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false },
              ]}
              helpMessagePrimary={t('renew-adult-child:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Save - Address click">
                {t('renew-adult-child:confirm-address.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Cancel - Address click">
                {t('renew-adult-child:confirm-address.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Address click">
                {t('renew-adult-child:confirm-address.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/confirm-email"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Address click"
              >
                {t('renew-adult-child:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

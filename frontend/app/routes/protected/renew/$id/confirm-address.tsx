import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

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
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmAddress,
  pageTitleI18nKey: 'protected-renew:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession(request);

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm-address.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: { hasAddressChanged: state.hasAddressChanged, isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress }, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected/renew/confirm-address');

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession(request);

  const state = loadProtectedRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    hasAddressChanged: z.nativeEnum(AddressRadioOptions, {
      errorMap: () => ({ message: t('protected-renew:confirm-address.error-message.has-address-changed-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { hasAddressChanged: formData.get('hasAddressChanged'), isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ?? '' };
  const parsedDataResult = confirmAddressSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      hasAddressChanged: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes,
      addressInformation: state.editMode && parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No ? undefined : state.addressInformation,
    },
  });

  if (parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes) {
    return redirect(getPathById('protected/renew/$id/update-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }
  return redirect(getPathById('protected/renew/$id/dental-insurance', params));
}

export default function ProtectedRenewConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <InputRadios
              id="has-address-changed"
              name="hasAddressChanged"
              legend={t('protected-renew:confirm-address.have-you-moved')}
              options={[
                { value: AddressRadioOptions.Yes, children: t('protected-renew:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true },
                { value: AddressRadioOptions.No, children: t('protected-renew:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false },
              ]}
              helpMessagePrimary={t('protected-renew:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Confirm address click">
                {t('protected-renew:confirm-address.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Confirm address click">
                {t('protected-renew:confirm-address.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Confirm address click">
                {t('protected-renew:confirm-address.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/confirm-email"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Confirm address click"
              >
                {t('protected-renew:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

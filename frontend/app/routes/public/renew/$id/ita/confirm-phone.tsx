import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputPhoneField } from '~/components/input-phone-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { loadRenewItaState } from '~/route-helpers/renew-ita-route-helpers.server';
import { saveRenewState } from '~/route-helpers/renew-route-helpers.server';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmPhone,
  pageTitleI18nKey: 'renew-ita:confirm-phone.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm-phone.page-title') }) };

  return {
    id: state.id,
    csrfToken,
    meta,
    defaultState: {
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
    maritalStatus: state.maritalStatus,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/confirm-phone');

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-ita:confirm-phone.error-message.phone-number-valid'))
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-ita:confirm-phone.error-message.phone-number-alt-valid'))
        .optional(),
    })
    .transform((val) => ({
      phoneNumber: val.phoneNumber ? parsePhoneNumberWithError(val.phoneNumber, 'CA').formatInternational() : val.phoneNumber,
      phoneNumberAlt: val.phoneNumberAlt ? parsePhoneNumberWithError(val.phoneNumberAlt, 'CA').formatInternational() : val.phoneNumberAlt,
    }));

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  };
  const parsedDataResult = phoneNumberSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/confirm-email', params));
}

export default function RenewAdultChildConfirmPhone() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={45} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6">
            <p className="mb-4" id="adding-phone">
              {t('renew-ita:confirm-phone.add-phone')}
            </p>
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
                label={t('renew-ita:confirm-phone.phone-number')}
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
                label={t('renew-ita:confirm-phone.phone-number-alt')}
                maxLength={100}
                aria-describedby="adding-phone"
              />
            </div>
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Contact information click">
                {t('renew-ita:confirm-phone.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Contact information click">
                {t('renew-ita:confirm-phone.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Contact information click"
              >
                {t('renew-ita:confirm-phone.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/ita/marital-status"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Contact information click"
              >
                {t('renew-ita:confirm-phone.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

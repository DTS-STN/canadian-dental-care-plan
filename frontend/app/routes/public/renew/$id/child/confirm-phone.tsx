import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputPhoneField } from '~/components/input-phone-field';
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

enum AddOrUpdatePhoneOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.confirmPhone,
  pageTitleI18nKey: 'renew-child:confirm-phone.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:confirm-phone.page-title') }) };

  return {
    id: state.id,

    meta,
    defaultState: {
      isNewOrUpdatedPhoneNumber: state.contactInformation?.isNewOrUpdatedPhoneNumber,
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
    hasMaritalStatusChanged: state.hasMaritalStatusChanged,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z
    .object({
      isNewOrUpdatedPhoneNumber: z.nativeEnum(AddOrUpdatePhoneOption, {
        errorMap: () => ({ message: t('renew-child:confirm-phone.error-message.add-or-update-required') }),
      }),
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-child:confirm-phone.error-message.phone-number-valid'))
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-child:confirm-phone.error-message.phone-number-alt-valid'))
        .optional(),
    })
    .superRefine((val, ctx) => {
      if (val.isNewOrUpdatedPhoneNumber === AddOrUpdatePhoneOption.Yes) {
        if (!val.phoneNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-child:confirm-phone.error-message.phone-required'), path: ['phoneNumber'] });
        }
      }
    })
    .transform((val) => ({
      isNewOrUpdatedPhoneNumber: val.isNewOrUpdatedPhoneNumber === AddOrUpdatePhoneOption.Yes,
      phoneNumber: val.phoneNumber ? parsePhoneNumberWithError(val.phoneNumber, 'CA').formatInternational() : val.phoneNumber,
      phoneNumberAlt: val.phoneNumberAlt ? parsePhoneNumberWithError(val.phoneNumberAlt, 'CA').formatInternational() : val.phoneNumberAlt,
    }));

  const parsedDataResult = phoneNumberSchema.safeParse({
    isNewOrUpdatedPhoneNumber: formData.get('isNewOrUpdatedPhoneNumber'),
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/child/confirm-email', params));
}

export default function RenewChildConfirmPhone() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, hasMaritalStatusChanged, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    isNewOrUpdatedPhoneNumber: 'input-radio-is-new-or-updated-phone-number-option-0',
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  const [isNewOrUpdatedPhoneNumber, setIsNewOrUpdatedPhoneNumber] = useState(defaultState.isNewOrUpdatedPhoneNumber);

  function handleNewOrUpdatePhoneNumberChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setIsNewOrUpdatedPhoneNumber(e.target.value === AddOrUpdatePhoneOption.Yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={45} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-6">
            <p className="mb-4" id="adding-phone">
              {t('renew-child:confirm-phone.add-phone')}
            </p>
            <InputRadios
              id="is-new-or-updated-phone-number"
              name="isNewOrUpdatedPhoneNumber"
              legend={t('renew-child:confirm-phone.add-or-update.legend')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-child:confirm-phone.option-yes" />,
                  value: AddOrUpdatePhoneOption.Yes,
                  defaultChecked: isNewOrUpdatedPhoneNumber === true,
                  onChange: handleNewOrUpdatePhoneNumberChanged,
                  append: isNewOrUpdatedPhoneNumber === true && (
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
                        label={t('renew-child:confirm-phone.phone-number')}
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
                        label={t('renew-child:confirm-phone.phone-number-alt')}
                        maxLength={100}
                        aria-describedby="adding-phone"
                      />
                    </div>
                  ),
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-child:confirm-phone.option-no" />,
                  value: AddOrUpdatePhoneOption.No,
                  defaultChecked: isNewOrUpdatedPhoneNumber === false,
                  onChange: handleNewOrUpdatePhoneNumberChanged,
                },
              ]}
              errorMessage={errors?.isNewOrUpdatedPhoneNumber}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Save - Contact information click">
                {t('renew-child:confirm-phone.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Cancel - Contact information click">
                {t('renew-child:confirm-phone.cancel-btn')}
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Continue - Contact information click"
              >
                {t('renew-child:confirm-phone.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={hasMaritalStatusChanged ? 'public/renew/$id/child/marital-status' : 'public/renew/$id/child/confirm-marital-status'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Contact information click"
              >
                {t('renew-child:confirm-phone.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

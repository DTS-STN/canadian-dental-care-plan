import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputPhoneField } from '~/components/input-phone-field';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewAdultChildState } from '~/route-helpers/renew-adult-child-route-helpers.server';
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

enum AddOrUpdatePhoneOption {
  Yes = 'yes',
  No = 'no',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmPhone,
  pageTitleI18nKey: 'renew-adult-child:confirm-phone.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-phone.page-title') }) };

  return {
    id: state.id,
    csrfToken,
    meta,
    defaultState: {
      isNewOrUpdatedPhoneNumber: state.contactInformation?.isNewOrUpdatedPhoneNumber,
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
    hasMaritalStatusChanged: state.hasMaritalStatusChanged,
    maritalStatus: state.maritalStatus,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/adult-child/confirm-phone');

  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z
    .object({
      isNewOrUpdatedPhoneNumber: z.nativeEnum(AddOrUpdatePhoneOption, {
        errorMap: () => ({ message: t('renew-adult-child:confirm-phone.error-message.add-or-update-required') }),
      }),
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-adult-child:confirm-phone.error-message.phone-number-valid'))
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-adult-child:confirm-phone.error-message.phone-number-alt-valid'))
        .optional(),
    })
    .superRefine((val, ctx) => {
      if (val.isNewOrUpdatedPhoneNumber === AddOrUpdatePhoneOption.Yes) {
        if (!val.phoneNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:confirm-phone.error-message.phone-required'), path: ['phoneNumber'] });
        }
      }
    })
    .transform((val) => ({
      isNewOrUpdatedPhoneNumber: val.isNewOrUpdatedPhoneNumber === AddOrUpdatePhoneOption.Yes,
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
    isNewOrUpdatedPhoneNumber: formData.get('isNewOrUpdatedPhoneNumber'),
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  };
  const parsedDataResult = phoneNumberSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/confirm-email', params));
}

export default function RenewAdultChildConfirmPhone() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, hasMaritalStatusChanged, editMode } = useLoaderData<typeof loader>();
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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6">
            <p className="mb-4" id="adding-phone">
              {t('renew-adult-child:confirm-phone.add-phone')}
            </p>
            <InputRadios
              id="is-new-or-updated-phone-number"
              name="isNewOrUpdatedPhoneNumber"
              legend={t('renew-adult-child:confirm-phone.add-or-update.legend')}
              helpMessagePrimary={t('renew-adult-child:confirm-phone.add-or-update.help-message')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-phone.option-yes" />,
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
                        label={t('renew-adult-child:confirm-phone.phone-number')}
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
                        label={t('renew-adult-child:confirm-phone.phone-number-alt')}
                        maxLength={100}
                        aria-describedby="adding-phone"
                      />
                    </div>
                  ),
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-phone.option-no" />,
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
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Contact information click">
                {t('renew-adult-child:confirm-phone.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Contact information click">
                {t('renew-adult-child:confirm-phone.cancel-btn')}
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
                {t('renew-adult-child:confirm-phone.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={hasMaritalStatusChanged ? 'public/renew/$id/adult-child/marital-status' : 'public/renew/$id/adult-child/confirm-marital-status'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Contact information click"
              >
                {t('renew-adult-child:confirm-phone.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

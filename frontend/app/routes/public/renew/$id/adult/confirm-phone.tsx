import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-phone';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultState } from '~/.server/routes/helpers/renew-adult-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { phoneSchema } from '~/.server/validation/phone-schema';
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

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
} as const;

const ADD_OR_UPDATE_PHONE_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adult.confirmPhone,
  pageTitleI18nKey: 'renew-adult:confirm-phone.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult:confirm-phone.page-title') }) };

  return {
    id: state.id,

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

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z
    .object({
      isNewOrUpdatedPhoneNumber: z.nativeEnum(ADD_OR_UPDATE_PHONE_OPTION, {
        errorMap: () => ({ message: t('renew-adult:confirm-phone.error-message.add-or-update-required') }),
      }),
      phoneNumber: phoneSchema({
        invalid_phone_canadian_error: t('renew-adult:confirm-phone.error-message.phone-number-valid'),
        invalid_phone_international_error: t('renew-adult:confirm-phone.error-message.phone-number-valid-international'),
      }).optional(),
      phoneNumberAlt: phoneSchema({
        invalid_phone_canadian_error: t('renew-adult:confirm-phone.error-message.phone-number-alt-valid'),
        invalid_phone_international_error: t('renew-adult:confirm-phone.error-message.phone-number-alt-valid-international'),
      }).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.isNewOrUpdatedPhoneNumber === ADD_OR_UPDATE_PHONE_OPTION.yes) {
        if (!val.phoneNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult:confirm-phone.error-message.phone-required'), path: ['phoneNumber'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      isNewOrUpdatedPhoneNumber: val.isNewOrUpdatedPhoneNumber === ADD_OR_UPDATE_PHONE_OPTION.yes,
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
    return redirect(getPathById('public/renew/$id/adult/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult/confirm-email', params));
}

export default function RenewAdultConfirmPhone({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, hasMaritalStatusChanged, editMode } = loaderData;

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
    setIsNewOrUpdatedPhoneNumber(e.target.value === ADD_OR_UPDATE_PHONE_OPTION.yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={44} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-6">
            <p className="mb-4" id="adding-phone">
              {t('renew-adult:confirm-phone.add-phone')}
            </p>
            <InputRadios
              id="is-new-or-updated-phone-number"
              name="isNewOrUpdatedPhoneNumber"
              legend={t('renew-adult:confirm-phone.add-or-update.legend')}
              helpMessagePrimary={t('renew-adult:confirm-phone.add-phone')}
              helpMessagePrimaryClassName="sr-only" // sr-only to not display helpMessagePrimary but enables screenreaders to read it.
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult:confirm-phone.option-yes" />,
                  value: ADD_OR_UPDATE_PHONE_OPTION.yes,
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
                        label={t('renew-adult:confirm-phone.phone-number')}
                        maxLength={100}
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
                        label={t('renew-adult:confirm-phone.phone-number-alt')}
                        maxLength={100}
                      />
                    </div>
                  ),
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult:confirm-phone.option-no" />,
                  value: ADD_OR_UPDATE_PHONE_OPTION.no,
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
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Phone Number click">
                {t('renew-adult:confirm-phone.save-btn')}
              </Button>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/adult/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Phone Number click">
                {t('renew-adult:confirm-phone.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FORM_ACTION.continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Phone Number click"
              >
                {t('renew-adult:confirm-phone.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={hasMaritalStatusChanged ? 'public/renew/$id/adult/marital-status' : 'public/renew/$id/adult/confirm-marital-status'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Phone Number click"
              >
                {t('renew-adult:confirm-phone.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

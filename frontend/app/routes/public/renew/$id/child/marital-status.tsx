import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadRenewChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
import type { PartnerInformationState } from '~/.server/routes/helpers/renew-route-helpers';
import { renewStateHasPartner, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.maritalStatus,
  pageTitleI18nKey: 'renew-child:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewChildState({ params, request, session });
  if (!state.hasMaritalStatusChanged) {
    return redirect(getPathById('public/renew/$id/child/confirm-marital-status', params));
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const maritalStatuses = appContainer.get(TYPES.domain.services.MaritalStatusService).listLocalizedMaritalStatuses(locale);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:marital-status.page-title') }) };

  return { defaultState: { maritalStatus: state.maritalStatus, ...state.partnerInformation }, editMode: state.editMode, id: state.id, maritalStatuses, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const maritalStatusSchema = z.object({
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('renew-child:marital-status.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('renew-child:marital-status.error-message.marital-status-required')),
  });

  const currentYear = new Date().getFullYear().toString();
  const partnerInformationSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, t('renew-child:marital-status.error-message.confirm-required')),
    yearOfBirth: z
      .string()
      .trim()
      .min(1, t('renew-child:marital-status.error-message.date-of-birth-year-required'))
      .refine((year) => year < currentYear, t('renew-child:marital-status.error-message.yob-is-future')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('renew-child:marital-status.error-message.sin-required'))
      .refine(isValidSin, t('renew-child:marital-status.error-message.sin-valid'))
      .refine((sin) => isValidSin(sin) && formatSin(sin, '') !== state.partnerInformation?.socialInsuranceNumber, t('renew-child:marital-status.error-message.sin-unique')),
  }) satisfies z.ZodType<PartnerInformationState>;

  const maritalStatusData = {
    maritalStatus: formData.get('maritalStatus') ? String(formData.get('maritalStatus')) : undefined,
  };
  const partnerInformationData = {
    confirm: formData.get('confirm') === 'yes',
    yearOfBirth: String(formData.get('yearOfBirth') ?? ''),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
  };

  const parsedMaritalStatus = maritalStatusSchema.safeParse(maritalStatusData);
  const parsedPartnerInformation = partnerInformationSchema.safeParse(partnerInformationData);

  if (!parsedMaritalStatus.success || (renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && !parsedPartnerInformation.success)) {
    return {
      errors: {
        ...(parsedMaritalStatus.error ? transformFlattenedError(parsedMaritalStatus.error.flatten()) : {}),
        ...(parsedMaritalStatus.success && renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && parsedPartnerInformation.error ? transformFlattenedError(parsedPartnerInformation.error.flatten()) : {}),
      },
    };
  }

  saveRenewState({ params, session, state: { maritalStatus: parsedMaritalStatus.data.maritalStatus, partnerInformation: parsedPartnerInformation.data } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/child/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/child/confirm-phone', params));
}

export default function RenewChildMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode, maritalStatuses } = loaderData;
  const { MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED } = useClientEnv();

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [marriedOrCommonlaw, setMarriedOrCommonlaw] = useState(defaultState.maritalStatus);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    maritalStatus: 'input-radio-marital-status-option-0',
    socialInsuranceNumber: 'social-insurance-number',
    yearOfBirth: 'year-of-birth',
    confirm: 'input-checkbox-confirm',
  });

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setMarriedOrCommonlaw(e.target.value);
  };

  const maritalStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return maritalStatuses.map((status) => ({ defaultChecked: status.id === defaultState.maritalStatus, children: status.name, value: status.id, onChange: handleChange }));
  }, [defaultState, maritalStatuses]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios id="marital-status" name="maritalStatus" legend={t('renew-child:marital-status.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />

            {(marriedOrCommonlaw === MARITAL_STATUS_CODE_COMMONLAW.toString() || marriedOrCommonlaw === MARITAL_STATUS_CODE_MARRIED.toString()) && (
              <>
                <h2 className="font-lato mb-6 text-2xl font-bold">{t('renew-child:marital-status.spouse-or-commonlaw')}</h2>
                <p className="mb-4">{t('renew-child:marital-status.provide-sin')}</p>
                <p className="mb-6">{t('renew-child:marital-status.required-information')}</p>
                <InputPatternField
                  id="social-insurance-number"
                  name="socialInsuranceNumber"
                  format={sinInputPatternFormat}
                  label={t('marital-status.sin')}
                  inputMode="numeric"
                  helpMessagePrimary={t('renew-child:marital-status.help-message.sin')}
                  helpMessagePrimaryClassName="text-black"
                  defaultValue={defaultState.socialInsuranceNumber ?? ''}
                  errorMessage={errors?.socialInsuranceNumber}
                  required
                />
                <InputPatternField id="year-of-birth" name="yearOfBirth" inputMode="numeric" format="####" defaultValue={defaultState.yearOfBirth ?? ''} label={t('renew-child:marital-status.year-of-birth')} errorMessage={errors?.yearOfBirth} required />
                <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState.confirm === true} required>
                  {t('renew-child:marital-status.confirm-checkbox')}
                </InputCheckbox>
              </>
            )}
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Save - Marital status click">
                {t('renew-child:marital-status.save-btn')}
              </Button>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/child/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Cancel - Marital status click">
                {t('renew-child:marital-status.cancel-btn')}
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Continue - Marital status click"
              >
                {t('renew-child:marital-status.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/child/confirm-marital-status"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Marital status click"
              >
                {t('renew-child:marital-status.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import type { PartnerInformationState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
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
import { extractDateParts } from '~/utils/date-utils';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.maritalStatus,
  pageTitleI18nKey: 'apply-adult:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const maritalStatuses = appContainer.get(TYPES.domain.services.MaritalStatusService).listLocalizedMaritalStatuses(locale);

  // Handle back button redirect
  invariant(state.applicantInformation?.dateOfBirth, 'Expected applicantInformation.dateOfBirth to be defined');
  const yearOfBirth = extractDateParts(state.applicantInformation.dateOfBirth).year;
  const isNewUser = Number(yearOfBirth) >= 2006;

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:marital-status.page-title') }) };
  return { isNewUser, defaultState: { maritalStatus: state.maritalStatus, ...state.partnerInformation }, editMode: state.editMode, maritalStatuses, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.cancel) {
    return redirect(getPathById('public/apply/$id/adult/review-information', params));
  }

  // state validation schema
  const maritalStatusSchema = z.object({
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply-adult:marital-status.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('apply-adult:marital-status.error-message.marital-status-required')),
  });

  const currentYear = new Date().getFullYear();
  const partnerInformationSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, t('apply-adult:marital-status.error-message.confirm-required')),
    yearOfBirth: z
      .string()
      .trim()
      .min(1, t('apply-adult:marital-status.error-message.date-of-birth-year-required'))
      .refine((year) => Number.parseInt(year) > currentYear - 150, t('apply-adult:marital-status.error-message.yob-is-past'))
      .refine((year) => Number.parseInt(year) < currentYear, t('apply-adult:marital-status.error-message.yob-is-future')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('apply-adult:marital-status.error-message.sin-required'))
      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:marital-status.error-message.sin-valid') });
        } else if (formatSin(sin) === state.applicantInformation?.socialInsuranceNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult:marital-status.error-message.sin-unique') });
        }
      }),
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

  if (!parsedMaritalStatus.success || (applicantInformationStateHasPartner(parsedMaritalStatus.data.maritalStatus) && !parsedPartnerInformation.success)) {
    return data(
      {
        errors: {
          ...(parsedMaritalStatus.error ? transformFlattenedError(parsedMaritalStatus.error.flatten()) : {}),
          ...(parsedMaritalStatus.success && applicantInformationStateHasPartner(parsedMaritalStatus.data.maritalStatus) && parsedPartnerInformation.error ? transformFlattenedError(parsedPartnerInformation.error.flatten()) : {}),
        },
      },
      { status: 400 },
    );
  }

  saveApplyState({
    params,
    session,
    state: {
      maritalStatus: parsedMaritalStatus.data.maritalStatus,
      partnerInformation: parsedPartnerInformation.data,
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult/review-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult/mailing-address', params));
}

export default function ApplyAdultMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { isNewUser, defaultState, editMode, maritalStatuses } = loaderData;
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
        <Progress value={40} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios id="marital-status" name="maritalStatus" legend={t('apply-adult:marital-status.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />

            {(marriedOrCommonlaw === MARITAL_STATUS_CODE_COMMONLAW.toString() || marriedOrCommonlaw === MARITAL_STATUS_CODE_MARRIED.toString()) && (
              <>
                <h2 className="font-lato mb-6 text-2xl font-bold">{t('apply-adult:marital-status.spouse-or-commonlaw')}</h2>
                <p className="mb-4">{t('apply-adult:marital-status.provide-sin')}</p>
                <p className="mb-6">{t('apply-adult:marital-status.required-information')}</p>
                <InputPatternField
                  id="social-insurance-number"
                  name="socialInsuranceNumber"
                  format={sinInputPatternFormat}
                  label={t('marital-status.sin')}
                  inputMode="numeric"
                  helpMessagePrimary={t('apply-adult:marital-status.help-message.sin')}
                  helpMessagePrimaryClassName="text-black"
                  defaultValue={defaultState.socialInsuranceNumber ?? ''}
                  errorMessage={errors?.socialInsuranceNumber}
                  required
                />
                <InputPatternField id="year-of-birth" name="yearOfBirth" inputMode="numeric" format="####" defaultValue={defaultState.yearOfBirth ?? ''} label={t('apply-adult:marital-status.year-of-birth')} errorMessage={errors?.yearOfBirth} required />
                <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState.confirm === true} required>
                  {t('apply-adult:marital-status.confirm-checkbox')}
                </InputCheckbox>
              </>
            )}
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Marital status click">
                {t('apply-adult:marital-status.save-btn')}
              </Button>
              <LoadingButton id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Marital status click">
                {t('apply-adult:marital-status.cancel-btn')}
              </LoadingButton>
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Marital status click"
              >
                {t('apply-adult:marital-status.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={isNewUser ? 'public/apply/$id/adult/new-or-existing-member' : 'public/apply/$id/adult/applicant-information'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Marital status click"
              >
                {t('apply-adult:marital-status.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

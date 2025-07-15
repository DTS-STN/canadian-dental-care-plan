import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-marital-status';

import { TYPES } from '~/.server/constants';
import { isInvitationToApplyClient, loadProtectedRenewState, renewStateHasPartner, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { PartnerInformationState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

const FORM_ACTION = {
  continue: 'continue',
  save: 'save',
} as const;

const MARITAL_STATUS = {
  single: 'single',
  married: 'married',
  commonlaw: 'commonlaw',
  separated: 'separated',
  divorced: 'divorced',
  widowed: 'widowed',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmMaritalStatus,
  pageTitleI18nKey: 'protected-renew:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });

  if (!isInvitationToApplyClient(state.clientApplication) && !state.editMode) {
    throw new Response('Not Found', { status: 404 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:marital-status.page-title') }) };

  const hasPartner = renewStateHasPartner(state.maritalStatus ?? state.clientApplication.applicantInformation.maritalStatus);
  const partnerInformation = hasPartner
    ? (state.clientApplication.partnerInformation ?? state.partnerInformation) && {
        yearOfBirth: state.partnerInformation?.yearOfBirth ?? state.clientApplication.partnerInformation?.yearOfBirth,
        socialInsuranceNumber: state.partnerInformation?.socialInsuranceNumber ?? state.clientApplication.partnerInformation?.socialInsuranceNumber,
        confirm: state.partnerInformation?.confirm ?? state.clientApplication.partnerInformation?.confirm,
      }
    : undefined;

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.renew.confirm-marital-status', { userId: idToken.sub });

  return {
    defaultState: {
      maritalStatus: state.maritalStatus ?? (isInvitationToApplyClient(state.clientApplication) ? undefined : state.clientApplication.applicantInformation.maritalStatus),
      partnerInformation,
    },
    meta,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const maritalStatusSchema = z.object({
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('protected-renew:marital-status.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('protected-renew:marital-status.error-message.marital-status-required')),
  });

  const currentYear = new Date().getFullYear();
  const partnerInformationSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, t('protected-renew:marital-status.error-message.confirm-required')),
    yearOfBirth: z
      .string()
      .trim()
      .min(1, t('protected-renew:marital-status.error-message.date-of-birth-year-required'))
      .refine((year) => Number.parseInt(year) > currentYear - 150, t('protected-renew:marital-status.error-message.yob-is-past'))
      .refine((year) => Number.parseInt(year) < currentYear, t('protected-renew:marital-status.error-message.yob-is-future')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('protected-renew:marital-status.error-message.sin-required'))
      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: 'custom', message: t('protected-renew:marital-status.error-message.sin-valid') });
        } else if (
          [state.clientApplication.applicantInformation.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(sin))
        ) {
          ctx.addIssue({ code: 'custom', message: t('protected-renew:marital-status.error-message.sin-unique') });
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

  if (!parsedMaritalStatus.success || (renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && !parsedPartnerInformation.success)) {
    return data(
      {
        errors: {
          ...(parsedMaritalStatus.error ? transformFlattenedError(parsedMaritalStatus.error.flatten()) : {}),
          ...(parsedMaritalStatus.success && renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && parsedPartnerInformation.error ? transformFlattenedError(parsedPartnerInformation.error.flatten()) : {}),
        },
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    request,
    session,
    state: { maritalStatus: parsedMaritalStatus.data.maritalStatus, partnerInformation: parsedPartnerInformation.data },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.renew.confirm-marital-status', { userId: idToken.sub });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/confirm-address', params));
}

export default function ProtectedRenewMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

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
    return [
      {
        value: MARITAL_STATUS.single,
        children: t('protected-renew:marital-status.single'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.single,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.married,
        children: t('protected-renew:marital-status.married'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.married,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.commonlaw,
        children: t('protected-renew:marital-status.commonlaw'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.commonlaw,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.separated,
        children: t('protected-renew:marital-status.separated'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.separated,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.divorced,
        children: t('protected-renew:marital-status.divorced'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.divorced,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.widowed,
        children: t('protected-renew:marital-status.widowed'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.widowed,
        onChange: handleChange,
      },
    ];
  }, [defaultState, t]);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputRadios id="marital-status" name="maritalStatus" legend={t('protected-renew:marital-status.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />

          {(marriedOrCommonlaw === MARITAL_STATUS.commonlaw || marriedOrCommonlaw === MARITAL_STATUS.married) && (
            <>
              <h2 className="font-lato mb-6 text-2xl font-bold">{t('protected-renew:marital-status.spouse-or-commonlaw')}</h2>
              <p className="mb-4">{t('protected-renew:marital-status.provide-sin')}</p>
              <p className="mb-6">{t('protected-renew:marital-status.required-information')}</p>
              <InputPatternField
                id="social-insurance-number"
                name="socialInsuranceNumber"
                format={sinInputPatternFormat}
                label={t('marital-status.sin')}
                inputMode="numeric"
                helpMessagePrimary={t('protected-renew:marital-status.help-message.sin')}
                helpMessagePrimaryClassName="text-black"
                defaultValue={defaultState.partnerInformation?.socialInsuranceNumber ?? ''}
                errorMessage={errors?.socialInsuranceNumber}
                required
              />
              <InputPatternField
                id="year-of-birth"
                name="yearOfBirth"
                inputMode="numeric"
                format="####"
                defaultValue={defaultState.partnerInformation?.yearOfBirth ?? ''}
                label={t('protected-renew:marital-status.year-of-birth')}
                errorMessage={errors?.yearOfBirth}
                required
              />
              <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState.partnerInformation?.confirm === true} required>
                {t('protected-renew:marital-status.confirm-checkbox')}
              </InputCheckbox>
            </>
          )}
        </div>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Save - Marital status click">
              {t('protected-renew:marital-status.save-btn')}
            </Button>
            <ButtonLink id="cancel-button" routeId="protected/renew/$id/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Cancel - Marital status click">
              {t('protected-renew:marital-status.cancel-btn')}
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
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Marital status click"
            >
              {t('protected-renew:marital-status.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/member-selection"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Marital status click"
            >
              {t('protected-renew:marital-status.back-btn')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

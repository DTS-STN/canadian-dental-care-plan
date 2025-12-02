import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import type { PartnerInformationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { applicantInformationStateHasPartner, getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
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
  cancel: 'cancel',
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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.maritalStatus,
  pageTitleI18nKey: 'application-spokes:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:marital-status.page-title') }) };
  return { defaultState: { maritalStatus: state.maritalStatus, ...state.partnerInformation }, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.cancel) {
    // TODO: needs to be generic
    return redirect(getPathById('public/application/$id/new-adult/marital-status', params));
  }

  // state validation schema
  const maritalStatusSchema = z.object({
    maritalStatus: z
      .string({ error: t('application-spokes:marital-status.error-message.marital-status-required') })
      .trim()
      .min(1, t('application-spokes:marital-status.error-message.marital-status-required')),
  });

  const currentYear = new Date().getFullYear();
  const partnerInformationSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, t('application-spokes:marital-status.error-message.confirm-required')),
    yearOfBirth: z
      .string()
      .trim()
      .min(1, t('application-spokes:marital-status.error-message.date-of-birth-year-required'))
      .refine((year) => Number.parseInt(year) > currentYear - 150, t('application-spokes:marital-status.error-message.yob-is-past'))
      .refine((year) => Number.parseInt(year) < currentYear, t('application-spokes:marital-status.error-message.yob-is-future')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('application-spokes:marital-status.error-message.sin-required'))

      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:marital-status.error-message.sin-valid') });
        } else if (state.applicantInformation?.socialInsuranceNumber && formatSin(sin) === formatSin(state.applicantInformation.socialInsuranceNumber)) {
          ctx.addIssue({ code: 'custom', message: t('application-spokes:marital-status.error-message.sin-unique') });
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
          ...(parsedMaritalStatus.error ? transformFlattenedError(z.flattenError(parsedMaritalStatus.error)) : {}),
          ...(parsedMaritalStatus.success && applicantInformationStateHasPartner(parsedMaritalStatus.data.maritalStatus) && parsedPartnerInformation.error ? transformFlattenedError(z.flattenError(parsedPartnerInformation.error)) : {}),
        },
      },
      { status: 400 },
    );
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      maritalStatus: parsedMaritalStatus.data.maritalStatus,
      partnerInformation: parsedPartnerInformation.data,
    },
  });

  // TODO: needs to be generic
  return redirect(getPathById('public/application/$id/new-adult/marital-status', params));
}

export default function ApplicationSpokeMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

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
        children: t('application-spokes:marital-status.single'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.single,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.married,
        children: t('application-spokes:marital-status.married'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.married,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.commonlaw,
        children: t('application-spokes:marital-status.commonlaw'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.commonlaw,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.separated,
        children: t('application-spokes:marital-status.separated'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.separated,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.divorced,
        children: t('application-spokes:marital-status.divorced'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.divorced,
        onChange: handleChange,
      },
      {
        value: MARITAL_STATUS.widowed,
        children: t('application-spokes:marital-status.widowed'),
        defaultChecked: defaultState.maritalStatus === MARITAL_STATUS.widowed,
        onChange: handleChange,
      },
    ];
  }, [defaultState, t]);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-8 space-y-6">
          <InputRadios id="marital-status" name="maritalStatus" legend={t('application-spokes:marital-status.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />

          {(marriedOrCommonlaw === MARITAL_STATUS.commonlaw || marriedOrCommonlaw === MARITAL_STATUS.married) && (
            <>
              <h2 className="font-lato mb-6 text-2xl font-bold">{t('application-spokes:marital-status.spouse-or-commonlaw')}</h2>
              <p className="mb-4">{t('application-spokes:marital-status.provide-sin')}</p>
              <p className="mb-6">{t('application-spokes:marital-status.required-information')}</p>
              <InputPatternField
                id="social-insurance-number"
                name="socialInsuranceNumber"
                format={sinInputPatternFormat}
                label={t('application-spokes:marital-status.sin')}
                inputMode="numeric"
                helpMessagePrimary={t('application-spokes:marital-status.help-message.sin')}
                helpMessagePrimaryClassName="text-black"
                defaultValue={defaultState.socialInsuranceNumber ?? ''}
                errorMessage={errors?.socialInsuranceNumber}
                required
              />
              <InputPatternField
                id="year-of-birth"
                name="yearOfBirth"
                inputMode="numeric"
                format="####"
                defaultValue={defaultState.yearOfBirth ?? ''}
                label={t('application-spokes:marital-status.year-of-birth')}
                errorMessage={errors?.yearOfBirth}
                required
              />
              <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState.confirm === true} required>
                {t('application-spokes:marital-status.confirm-checkbox')}
              </InputCheckbox>
            </>
          )}
        </div>
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
            {t('application-spokes:marital-status.continue-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId="public/application/$id/new-adult/marital-status" // TODO: needs to be generic
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Marital status click"
          >
            {t('application-spokes:marital-status.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

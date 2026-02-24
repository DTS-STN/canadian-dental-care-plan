import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import type { ApplicationFlow, PartnerInformationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { applicantInformationStateHasPartner, getPublicApplicationState, savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'full-children': {
      return `public/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `public/application/$id/${applicationFlow}/marital-status`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.maritalStatus,
  pageTitleI18nKey: 'application-spokes:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:marital-status.page-title') }) };
  const maritalStatuses = appContainer.get(TYPES.MaritalStatusService).listLocalizedMaritalStatuses(locale);
  return {
    defaultState: { maritalStatus: state.maritalStatus, ...state.partnerInformation },
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}` as const,
    meta,
    maritalStatuses,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.inputModel}-${state.typeOfApplication}`;

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
        } else if (
          [state.applicantInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
            .filter((sin) => sin !== undefined)
            .map((sin) => formatSin(sin))
            .includes(formatSin(sin))
        ) {
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

  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function ApplicationSpokeMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, maritalStatuses, applicationFlow } = loaderData;
  const { MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED } = useClientEnv();
  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState(defaultState.maritalStatus);

  const errors = fetcher.data?.errors;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSelectedMaritalStatus(e.target.value);
  };

  const maritalStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return maritalStatuses.map(({ id, name }) => ({
      value: id,
      children: name,
      defaultChecked: defaultState.maritalStatus === id,
      onChange: handleChange,
    }));
  }, [defaultState, maritalStatuses]);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="mb-8 space-y-6">
            <InputRadios
              id="marital-status"
              name="maritalStatus"
              legend={t('application-spokes:marital-status.marital-status')}
              helpMessagePrimary={t('application-spokes:marital-status.primary-help-message')}
              options={maritalStatusOptions}
              errorMessage={errors?.maritalStatus}
              required
            />

            {(selectedMaritalStatus === MARITAL_STATUS_CODE_COMMON_LAW || selectedMaritalStatus === MARITAL_STATUS_CODE_MARRIED) && (
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
                  helpMessagePrimary={t('application-spokes:marital-status.sin-help')}
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
                  helpMessagePrimary={t('application-spokes:marital-status.year-of-birth-help')}
                  helpMessagePrimaryClassName="text-black"
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
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Save - Marital status click">
              {t('application-spokes:marital-status.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={getRouteFromApplicationFlow(applicationFlow)}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Back - Marital status click"
            >
              {t('application-spokes:marital-status.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}

import { useEffect, useRef } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/applicant-information';

import { TYPES } from '~/.server/constants';
import type { ApplicantInformationState } from '~/.server/routes/helpers/renew-route-helpers';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { isValidClientNumberRenewal, renewalCodeInputPatternFormat } from '~/utils/application-code-utils';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits, hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.applicantInformation,
  pageTitleI18nKey: 'renew:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:applicant-information.page-title') }) };

  return { id: state.id, meta, defaultState: state.applicantInformation, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const clientApplicationService = appContainer.get(TYPES.domain.services.ClientApplicationService);

  // state validation schema
  const applicantInformationSchema = z
    .object({
      dateOfBirthYear: z.number({
        required_error: t('renew:applicant-information.error-message.date-of-birth-year-required'),
        invalid_type_error: t('renew:applicant-information.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('renew:applicant-information.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('renew:applicant-information.error-message.date-of-birth-day-required'),
        invalid_type_error: t('renew:applicant-information.error-message.date-of-birth-day-number'),
      }),
      dateOfBirth: z.string(),
      firstName: z
        .string()
        .trim()
        .min(1, t('renew:applicant-information.error-message.first-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('renew:applicant-information.error-message.characters-valid'))
        .refine((firstName) => !hasDigits(firstName), t('renew:applicant-information.error-message.first-name-no-digits')),
      lastName: z
        .string()
        .trim()
        .min(1, t('renew:applicant-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('renew:applicant-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('renew:applicant-information.error-message.last-name-no-digits')),
      clientNumber: z
        .string()
        .trim()
        .min(1, t('renew:applicant-information.error-message.client-number-required'))
        .refine(isValidClientNumberRenewal, t('renew:applicant-information.error-message.client-number-valid'))
        .transform((code) => extractDigits(code)),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew:applicant-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew:applicant-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew:applicant-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`,
      };
    }) satisfies z.ZodType<ApplicantInformationState>;

  const parsedDataResult = applicantInformationSchema.safeParse({
    confirm: formData.get('confirm') === 'yes',
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    clientNumber: String(formData.get('clientNumber') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  // Fetch client application data using ClientApplicationService
  const clientApplication = await clientApplicationService.findClientApplicationByBasicInfo({
    firstName: parsedDataResult.data.firstName,
    lastName: parsedDataResult.data.lastName,
    dateOfBirth: parsedDataResult.data.dateOfBirth,
    clientNumber: parsedDataResult.data.clientNumber,
    applicationYearId: state.applicationYear.renewalYearId,
    userId: 'anonymous',
  });

  if (!clientApplication) {
    return { status: 'status-not-found' } as const;
  }

  saveRenewState({ params, session, state: { applicantInformation: parsedDataResult.data, clientApplication } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/review-information', params));
  }

  if (clientApplication.hasFiledTaxes) {
    return redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  return redirect(getPathById('public/renew/$id/tax-filing', params));
}

export default function RenewApplicationInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    clientNumber: 'client-number',
  });

  const eligibilityLink = <InlineLink to={t('renew:applicant-information.eligibility-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={7} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        {fetcherStatus === 'status-not-found' && <StatusNotFound />}
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <p className="mb-6">{t('renew:applicant-information.required-information')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="space-y-6">
            <Collapsible id="name-instructions" summary={t('renew:applicant-information.single-legal-name')}>
              <p>{t('renew:applicant-information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                className="w-full"
                label={t('renew:applicant-information.first-name')}
                maxLength={100}
                autoComplete="given-name"
                defaultValue={defaultState?.firstName ?? ''}
                errorMessage={errors?.firstName}
                aria-description={t('renew:applicant-information.name-instructions')}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                className="w-full"
                label={t('renew:applicant-information.last-name')}
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('renew:applicant-information.name-instructions')}
                required
              />
            </div>
            <DatePickerField
              id="date-of-birth"
              names={{
                day: 'dateOfBirthDay',
                month: 'dateOfBirthMonth',
                year: 'dateOfBirthYear',
              }}
              defaultValue={defaultState?.dateOfBirth ?? ''}
              legend={t('renew:applicant-information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />
            <InputPatternField
              id="client-number"
              name="clientNumber"
              label={t('renew:applicant-information.client-number')}
              inputMode="numeric"
              format={renewalCodeInputPatternFormat}
              helpMessagePrimary={t('renew:applicant-information.help-message.client-number')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.clientNumber ?? ''}
              errorMessage={errors?.clientNumber}
              required
            />
            <Collapsible id="no-client-number" summary={t('renew:applicant-information.no-client-number')}>
              <div className="space-y-2">
                <p>{t('renew:applicant-information.renew-client-number')}</p>
                <p>{t('renew:applicant-information.apply-to-cdcp')}</p>
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="renew:applicant-information.check-eligibility" components={{ eligibilityLink }} />
                </p>
              </div>
            </Collapsible>
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="save-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Save - Personal information click">
                {t('renew:applicant-information.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId={defaultState ? 'public/renew/$id/review-information' : 'public/renew/$id/terms-and-conditions'}
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Cancel - Personal information click"
              >
                {t('renew:applicant-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Continue - Personal information click">
                {t('renew:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/terms-and-conditions"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Back - Personal information click"
              >
                {t('renew:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

function StatusNotFound() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const noWrap = <span className="whitespace-nowrap" />;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: 'smooth' });
      wrapperRef.current.focus();
    }
  }, []);

  return (
    <div ref={wrapperRef} id="status-not-found" className="mb-4">
      <ContextualAlert type="danger">
        <h2 className="mb-2 font-bold">{t('renew:applicant-information.status-not-found.heading')}</h2>
        <p className="mb-2">{t('renew:applicant-information.status-not-found.please-review')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="renew:applicant-information.status-not-found.contact-service-canada" components={{ noWrap }} />
        </p>
      </ContextualAlert>
    </div>
  );
}

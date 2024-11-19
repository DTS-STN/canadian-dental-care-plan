import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import type { PartnerInformationState } from '~/route-helpers/apply-route-helpers.server';
import { applicantInformationStateHasPartner, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { hasDigits, isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.partnerInformation,
  pageTitleI18nKey: 'apply-child:partner-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  if (state.applicantInformation === undefined || !applicantInformationStateHasPartner(state.applicantInformation)) {
    return redirect(getPathById('public/apply/$id/child/applicant-information', params));
  }

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:partner-information.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: state.partnerInformation, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/partner-information');

  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const partnerInformationSchema = z
    .object({
      confirm: z.boolean().refine((val) => val === true, t('apply-child:partner-information.error-message.confirm-required')),
      dateOfBirthYear: z.number({
        required_error: t('apply-child:partner-information.error-message.date-of-birth-year-required'),
        invalid_type_error: t('apply-child:partner-information.error-message.date-of-birth-year-number'),
      }),
      dateOfBirthMonth: z.number({
        required_error: t('apply-child:partner-information.error-message.date-of-birth-month-required'),
      }),
      dateOfBirthDay: z.number({
        required_error: t('apply-child:partner-information.error-message.date-of-birth-day-required'),
        invalid_type_error: t('apply-child:partner-information.error-message.date-of-birth-day-number'),
      }),
      dateOfBirth: z.string(),
      firstName: z.string().trim().min(1, t('apply-child:partner-information.error-message.first-name-required')).max(100).refine(isAllValidInputCharacters, t('apply-child:partner-information.error-message.characters-valid')),
      lastName: z
        .string()
        .trim()
        .min(1, t('apply-child:partner-information.error-message.last-name-required'))
        .max(100)
        .refine(isAllValidInputCharacters, t('apply-child:partner-information.error-message.characters-valid'))
        .refine((lastName) => !hasDigits(lastName), t('apply-child:partner-information.error-message.no-digits')),
      socialInsuranceNumber: z
        .string()
        .trim()
        .min(1, t('apply-child:partner-information.error-message.sin-required'))
        .refine(isValidSin, t('apply-child:partner-information.error-message.sin-valid'))
        .refine((sin) => isValidSin(sin) && formatSin(sin, '') !== state.applicantInformation?.socialInsuranceNumber, t('apply-child:partner-information.error-message.sin-unique'))
        .superRefine((sin, ctx) => {
          if (!isValidSin(sin)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:partner-information.error-message.sin-valid') });
          } else if (
            [state.applicantInformation?.socialInsuranceNumber, ...state.children.map((child) => child.information?.socialInsuranceNumber)]
              .filter((sin) => sin !== undefined)
              .map((sin) => formatSin(sin))
              .includes(formatSin(sin))
          ) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:children.information.error-message.sin-unique') });
          }
        }),
    })
    .superRefine((val, ctx) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      const dateOfBirth = `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`;

      if (!isValidDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:partner-information.error-message.date-of-birth-valid'), path: ['dateOfBirth'] });
      } else if (!isPastDateString(dateOfBirth)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:partner-information.error-message.date-of-birth-is-past'), path: ['dateOfBirth'] });
      } else if (getAgeFromDateString(dateOfBirth) > 150) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-child:partner-information.error-message.date-of-birth-is-past-valid'), path: ['dateOfBirth'] });
      }
    })
    .transform((val) => {
      // At this point the year, month and day should have been validated as positive integer
      const dateOfBirthParts = extractDateParts(`${val.dateOfBirthYear}-${val.dateOfBirthMonth}-${val.dateOfBirthDay}`);
      return {
        ...val,
        dateOfBirth: `${dateOfBirthParts.year}-${dateOfBirthParts.month}-${dateOfBirthParts.day}`,
      };
    }) satisfies z.ZodType<PartnerInformationState>;

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirm: formData.get('confirm') === 'yes',
    dateOfBirthYear: formData.get('dateOfBirthYear') ? Number(formData.get('dateOfBirthYear')) : undefined,
    dateOfBirthMonth: formData.get('dateOfBirthMonth') ? Number(formData.get('dateOfBirthMonth')) : undefined,
    dateOfBirthDay: formData.get('dateOfBirthDay') ? Number(formData.get('dateOfBirthDay')) : undefined,
    dateOfBirth: '',
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
  };
  const parsedDataResult = partnerInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveApplyState({ params, session, state: { partnerInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/child/review-adult-information', params));
  }

  return redirect(getPathById('public/apply/$id/child/contact-information', params));
}

export default function ApplyFlowApplicationInformation() {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode, csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(currentLanguage === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    socialInsuranceNumber: 'social-insurance-number',
    confirm: 'input-checkbox-confirm',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('partner-information.provide-sin')}</p>
        <p className="mb-6">{t('partner-information.required-information')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <Collapsible id="name-instructions" summary={t('partner-information.single-legal-name')}>
              <p>{t('partner-information.name-instructions')}</p>
            </Collapsible>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputSanitizeField
                id="first-name"
                name="firstName"
                className="w-full"
                label={t('apply-child:partner-information.first-name')}
                maxLength={100}
                autoComplete="given-name"
                defaultValue={defaultState?.firstName ?? ''}
                errorMessage={errors?.firstName}
                aria-description={t('partner-information.name-instructions')}
                required
              />
              <InputSanitizeField
                id="last-name"
                name="lastName"
                className="w-full"
                label={t('apply-child:partner-information.last-name')}
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errors?.lastName}
                aria-description={t('partner-information.name-instructions')}
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
              legend={t('apply-child:partner-information.date-of-birth')}
              errorMessages={{
                all: errors?.dateOfBirth,
                year: errors?.dateOfBirthYear,
                month: errors?.dateOfBirthMonth,
                day: errors?.dateOfBirthDay,
              }}
              required
            />
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('apply-child:partner-information.sin')}
              inputMode="numeric"
              helpMessagePrimary={t('apply-child:partner-information.help-message.sin')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
              required
            />
            <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState?.confirm === true} required>
              {t('partner-information.confirm-checkbox')}
            </InputCheckbox>
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Spouse or Common-law partner information click">
                {t('apply-child:partner-information.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId={defaultState ? 'public/apply/$id/child/review-adult-information' : 'public/apply/$id/child/applicant-information'}
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Spouse or Common-law partner information click"
              >
                {t('apply-child:partner-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Spouse or Common-law partner information click">
                {t('apply-child:partner-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/applicant-information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Spouse or Common-law partner information click"
              >
                {t('apply-child:partner-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

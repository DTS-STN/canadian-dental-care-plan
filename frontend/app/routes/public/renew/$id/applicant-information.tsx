import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ContextualAlert } from '~/components/contextual-alert';
import { DatePickerField } from '~/components/date-picker-field';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputSanitizeField } from '~/components/input-sanitize-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import type { ApplicantInformationState } from '~/route-helpers/renew-route-helpers.server';
import { loadRenewState, saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { extractDateParts, getAgeFromDateString, isPastDateString, isValidDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isAllValidInputCharacters } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.renew.applicantInformation,
  pageTitleI18nKey: 'renew:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:applicant-information.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.applicantInformation, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/applicant-information');

  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

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
      firstName: z.string().trim().min(1, t('renew:applicant-information.error-message.first-name-required')).max(100).refine(isAllValidInputCharacters, t('renew:applicant-information.error-message.characters-valid')),
      lastName: z.string().trim().min(1, t('renew:applicant-information.error-message.last-name-required')).max(100).refine(isAllValidInputCharacters, t('renew:applicant-information.error-message.characters-valid')),
      clientNumber: z.string().trim().min(1, t('renew:applicant-information.error-message.client-number-required')),
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
    clientNumber: String(formData.get('clientNumber') ?? ''),
  };
  const parsedDataResult = applicantInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  // todo: make request for client application => if not found return back to page to display the <StausNotFound /> otherwise continue with next page

  saveRenewState({ params, session, state: { applicantInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult/type-renewal', params));
}

export default function ApplyFlowApplicationInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode, csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    firstName: 'first-name',
    lastName: 'last-name',
    ...(i18n.language === 'fr'
      ? { dateOfBirth: 'date-picker-date-of-birth-day', dateOfBirthDay: 'date-picker-date-of-birth-day', dateOfBirthMonth: 'date-picker-date-of-birth-month' }
      : { dateOfBirth: 'date-picker-date-of-birth-month', dateOfBirthMonth: 'date-picker-date-of-birth-month', dateOfBirthDay: 'date-picker-date-of-birth-day' }),
    dateOfBirthYear: 'date-picker-date-of-birth-year',
    clientNumber: 'client-number',
  });

  const eligibilityLink = <InlineLink to={t('renew:applicant-information.eligibility-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <>
      <StatusNotFound />
      <div className="my-6 sm:my-8">
        <Progress value={25} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <p className="mb-6">{t('renew:applicant-information.required-information')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
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
                // eslint-disable-next-line jsx-a11y/aria-props
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
                // eslint-disable-next-line jsx-a11y/aria-props
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
            <InputSanitizeField
              id="client-number"
              name="clientNumber"
              label={t('renew:applicant-information.client-number')}
              inputMode="numeric"
              helpMessagePrimary={t('renew:applicant-information.help-message.client-number')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={defaultState?.clientNumber ?? ''}
              errorMessage={errors?.clientNumber}
              required
            />
            <Collapsible id="no-client-number" summary={t('renew:applicant-information.no-client-number')}>
              <div className="space-y-2">
                <p>{t('renew:applicant-information.unique-client-number')}</p>
                <p>{t('renew:applicant-information.not-eligible')}</p>
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="renew:applicant-information.check-eligibility" components={{ eligibilityLink }} />
                </p>
              </div>
            </Collapsible>
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form:Save - Applicant information click">
                {t('renew:applicant-information.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId={defaultState ? 'public/renew/$id/review-information' : 'public/renew/$id/terms-and-conditions'}
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form:Cancel - Applicant information click"
              >
                {t('renew:applicant-information.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form:Continue - Applicant information click">
                {t('renew:applicant-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/terms-and-conditions"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Renewal Form:Back - Applicant information click"
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
  return (
    <div className="mb-4">
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

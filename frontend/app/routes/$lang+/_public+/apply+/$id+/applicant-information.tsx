import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export type ApplicantInformationState = {
  firstName: string;
  lastName: string;
  maritalStatus: string;
  socialInsuranceNumber: string;
};

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.applicantInformation,
  pageTitleI18nKey: 'apply:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const lookupService = getLookupService();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const maritalStatuses = await lookupService.getAllMaritalStatuses();

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:applicant-information.page-title') }) };

  return json({ id: state.id, maritalStatuses, csrfToken, meta, defaultState: state.applicantInformation, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/applicant-information');

  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Cancel) {
    invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');

    if (applyRouteHelpers.hasPartner(state.applicantInformation) && state.partnerInformation === undefined) {
      const errorMessage = t('apply:applicant-information.error-message.marital-status-no-partner-information');
      const errors: z.ZodFormattedError<ApplicantInformationState, string> = { _errors: [errorMessage], maritalStatus: { _errors: [errorMessage] } };
      return json({ errors });
    }

    return redirect(getPathById('$lang+/_public+/apply+/$id+/review-information', params));
  }

  // Form action Continue & Save
  // state validation schema
  const applicantInformationSchema: z.ZodType<ApplicantInformationState> = z.object({
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('apply:applicant-information.error-message.sin-required'))
      .superRefine((sin, ctx) => {
        if (!isValidSin(sin)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:applicant-information.error-message.sin-valid'), fatal: true });
          return z.NEVER;
        }

        if (state.partnerInformation && formatSin(sin) === formatSin(state.partnerInformation.socialInsuranceNumber)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:applicant-information.error-message.sin-unique'), fatal: true });
          return z.NEVER;
        }
      }),
    firstName: z.string().trim().min(1, t('apply:applicant-information.error-message.first-name-required')).max(100),
    lastName: z.string().trim().min(1, t('apply:applicant-information.error-message.last-name-required')).max(100),
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply:applicant-information.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('apply:applicant-information.error-message.marital-status-required')),
  });

  const data = {
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    maritalStatus: formData.get('maritalStatus') ? String(formData.get('maritalStatus')) : undefined,
  };

  const parsedDataResult = applicantInformationSchema.safeParse(data);
  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const hasPartner = applyRouteHelpers.hasPartner(parsedDataResult.data);
  const remove = !hasPartner ? 'partnerInformation' : undefined;
  await applyRouteHelpers.saveState({ params, remove, request, session, state: { applicantInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/review-information', params));
  }

  if (hasPartner) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/partner-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/personal-information', params));
}

export default function ApplyFlowApplicationInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, maritalStatuses, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'first-name': fetcher.data?.errors.firstName?._errors[0],
      'last-name': fetcher.data?.errors.lastName?._errors[0],
      'social-insurance-number': fetcher.data?.errors.socialInsuranceNumber?._errors[0],
      'input-radio-marital-status-option-0': fetcher.data?.errors.maritalStatus?._errors[0],
    }),
    [fetcher.data?.errors.firstName?._errors, fetcher.data?.errors.lastName?._errors, fetcher.data?.errors.maritalStatus?._errors, fetcher.data?.errors.socialInsuranceNumber?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={40} size="lg" />
      </div>
      <div className="max-w-prose">
        <p id="form-instructions-sin" className="mb-4">
          {t('applicant-information.form-instructions-sin')}
        </p>
        <p id="form-instructions-info" className="mb-6">
          {t('applicant-information.form-instructions-info')}
        </p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" aria-describedby="form-instructions-sin form-instructions-info form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <p className="mb-6 italic" id="form-instructions">
              {t('apply:required-label')}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                label={t('applicant-information.first-name')}
                className="w-full"
                maxLength={100}
                aria-describedby="name-instructions"
                autoComplete="given-name"
                errorMessage={errorMessages['first-name']}
                defaultValue={defaultState?.firstName ?? ''}
                required
              />
              <InputField
                id="last-name"
                name="lastName"
                label={t('applicant-information.last-name')}
                className="w-full"
                maxLength={100}
                autoComplete="family-name"
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errorMessages['last-name']}
                aria-describedby="name-instructions"
                required
              />
              <em id="name-instructions" className="col-span-full">
                {t('applicant-information.name-instructions')}
              </em>
            </div>
            <InputField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              label={t('applicant-information.sin')}
              placeholder="000-000-000"
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errorMessages['social-insurance-number']}
              required
            />
            <InputRadios
              id="marital-status"
              name="maritalStatus"
              legend={t('applicant-information.marital-status')}
              options={maritalStatuses.map((status) => ({ defaultChecked: status.id === defaultState?.maritalStatus, children: getNameByLanguage(i18n.language, status), value: status.id }))}
              errorMessage={errorMessages['input-radio-marital-status-option-0']}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Applicant Information click">
                {t('apply:applicant-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Applicant Information click">
                {t('apply:applicant-information.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button id="continue-button" name="_action" value={FormAction.Continue} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Applicant Information click">
                {t('apply:applicant-information.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applicant Information click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply:applicant-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}

import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValid, parse } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export interface PartnerInformationState {
  confirm: boolean;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.partnerInformation,
  pageTitleI18nKey: 'apply:partner-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // TODO: the flow for where to redirect to will need to be determined depending on the state of the form
  if (!['MARRIED', 'COMMONLAW'].includes(state.applicantInformation?.maritalStatus ?? '')) {
    return redirectWithLocale(request, `/apply/${id}/contact-information`);
  }

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:partner-information.page-title') }) };

  return json({ id, csrfToken, meta, defaultState: state.partnerInformation, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/partner-information');

  const applyRouteHelpers = getApplyRouteHelpers();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const partnerInformationSchema: z.ZodType<PartnerInformationState> = z.object({
    confirm: z.boolean().refine((val) => val === true, t('apply:partner-information.error-message.confirm-required')),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, t('apply:partner-information.error-message.date-of-birth-required-and-valid'))
      .refine((val) => isValid(parse(val, 'yyyy-MM-dd', new Date())), t('apply:partner-information.error-message.date-of-birth-required-and-valid')),
    firstName: z.string().trim().min(1, t('apply:partner-information.error-message.first-name-required')),
    lastName: z.string().trim().min(1, t('apply:partner-information.error-message.last-name-required')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('apply:partner-information.error-message.sin-required'))
      .refine(isValidSin, t('apply:partner-information.error-message.sin-valid'))
      .refine((sin) => sin !== state.applicantInformation?.socialInsuranceNumber, t('apply:partner-information.error-message.sin-unique')),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirm: formData.get('confirm') === 'yes',
    dateOfBirth: String(formData.get('dateOfBirth') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
  };
  const parsedDataResult = partnerInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const sessionResponseInit = await applyRouteHelpers.saveState({ params, request, session, state: { partnerInformation: parsedDataResult.data } });
  return redirectWithLocale(request, state.editMode ? `/apply/${id}/review-information` : `/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, defaultState, editMode, csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'first-name': fetcher.data?.errors.firstName?._errors[0],
      'last-name': fetcher.data?.errors.lastName?._errors[0],
      'date-picker-date-of-birth-month': fetcher.data?.errors.dateOfBirth?._errors[0],
      'social-insurance-number': fetcher.data?.errors.socialInsuranceNumber?._errors[0],
      'input-checkbox-confirm': fetcher.data?.errors.confirm?._errors[0],
    }),
    [fetcher.data?.errors.confirm?._errors, fetcher.data?.errors.dateOfBirth?._errors, fetcher.data?.errors.firstName?._errors, fetcher.data?.errors.lastName?._errors, fetcher.data?.errors.socialInsuranceNumber?._errors],
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
        <Progress aria-labelledby="progress-label" value={50} size="lg" />
      </div>
      <div className="max-w-prose">
        <p id="form-instructions-provide-sin" className="mb-4">
          {t('partner-information.provide-sin')}
        </p>
        <p id="form-instructions-required-information" className="mb-6">
          {t('partner-information.required-information')}
        </p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" aria-describedby="form-instructions-provide-sin form-instructions-required-information" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <em id="name-instructions">{t('partner-information.name-instructions')}</em>
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                className="w-full"
                label={t('apply:partner-information.first-name')}
                required
                defaultValue={defaultState?.firstName ?? ''}
                errorMessage={errorMessages['first-name']}
                aria-describedby="name-instructions"
              />
              <InputField
                id="last-name"
                name="lastName"
                className="w-full"
                label={t('apply:partner-information.last-name')}
                required
                defaultValue={defaultState?.lastName ?? ''}
                errorMessage={errorMessages['last-name']}
                aria-describedby="name-instructions"
              />
            </div>
            <DatePickerField id="date-of-birth" name="dateOfBirth" defaultValue={defaultState?.dateOfBirth ?? ''} legend={t('apply:partner-information.date-of-birth')} required errorMessage={errorMessages['date-picker-date-of-birth-month']} />
            <InputField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              label={t('apply:partner-information.sin')}
              required
              inputMode="numeric"
              pattern="\d{9}"
              placeholder={formatSin('000000000', '-')}
              minLength={9}
              maxLength={9}
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errorMessages['social-insurance-number']}
            />
            <InputCheckbox id="confirm" name="confirm" value="yes" required errorMessage={errorMessages['input-checkbox-confirm']} defaultChecked={defaultState?.confirm === true}>
              {t('partner-information.confirm-checkbox')}
            </InputCheckbox>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {editMode ? (
              <>
                <ButtonLink id="back-button" to={`/apply/${id}/review-information`} disabled={isSubmitting}>
                  {t('apply:partner-information.cancel-btn')}
                </ButtonLink>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('apply:partner-information.save-btn')}
                </Button>
              </>
            ) : (
              <>
                <ButtonLink id="back-button" to={`/apply/${id}/applicant-information`} disabled={isSubmitting}>
                  <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                  {t('apply:partner-information.back-btn')}
                </ButtonLink>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('apply:partner-information.continue-btn')}
                  <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
                </Button>
              </>
            )}
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

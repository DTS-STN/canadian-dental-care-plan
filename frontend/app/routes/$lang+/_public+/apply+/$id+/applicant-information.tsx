import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

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
  const applyFlow = getApplyFlow();
  const lookupService = getLookupService();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const maritalStatuses = await lookupService.getAllMaritalStatuses();

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:applicant-information.page-title') }) };

  return json({ id, maritalStatuses, meta, defaultState: state.applicantInformation, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const applicantInformationSchema: z.ZodType<ApplicantInformationState> = z.object({
    socialInsuranceNumber: z.string().trim().min(1, t('apply:applicant-information.error-message.sin-required')).refine(isValidSin, t('apply:applicant-information.error-message.sin-valid')),
    firstName: z.string().trim().min(1, t('apply:applicant-information.error-message.first-name-required')),
    lastName: z.string().trim().min(1, t('apply:applicant-information.error-message.last-name-required')),
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply:applicant-information.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('apply:applicant-information.error-message.marital-status-required')),
  });

  const formData = await request.formData();
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

  const remove = !['MARRIED', 'COMMONLAW'].includes(parsedDataResult.data.maritalStatus) ? 'partnerInformation' : undefined;
  const sessionResponseInit = await applyFlow.saveState({ params, remove, request, session, state: { applicantInformation: parsedDataResult.data } });

  if (['MARRIED', 'COMMONLAW'].includes(parsedDataResult.data.maritalStatus)) {
    return redirectWithLocale(request, state.editMode && state.partnerInformation ? `/apply/${id}/review-information` : `/apply/${id}/partner-information`, sessionResponseInit);
  }

  return redirectWithLocale(request, state.editMode ? `/apply/${id}/review-information` : `/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, defaultState, maritalStatuses, editMode } = useLoaderData<typeof loader>();
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
        <fetcher.Form method="post" aria-describedby="form-instructions-sin form-instructions-info" noValidate>
          <div className="mb-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="first-name"
                name="firstName"
                label={t('applicant-information.first-name')}
                className="w-full"
                required
                aria-describedby="name-instructions"
                errorMessage={errorMessages['first-name']}
                defaultValue={defaultState?.firstName ?? ''}
              />
              <InputField id="last-name" name="lastName" label={t('applicant-information.last-name')} className="w-full" required defaultValue={defaultState?.lastName ?? ''} errorMessage={errorMessages['last-name']} aria-describedby="name-instructions" />
            </div>
            <p id="name-instructions">{t('applicant-information.name-instructions')}</p>
            <InputField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              label={t('applicant-information.sin')}
              required
              inputMode="numeric"
              pattern="\d{9}"
              placeholder={formatSin('000000000', '-')}
              minLength={9}
              maxLength={9}
              defaultValue={defaultState?.socialInsuranceNumber ?? ''}
              errorMessage={errorMessages['social-insurance-number']}
            />
            <InputRadios
              id="marital-status"
              name="maritalStatus"
              legend={t('applicant-information.marital-status')}
              options={maritalStatuses.map((status) => ({ defaultChecked: status.code === defaultState?.maritalStatus, children: getNameByLanguage(i18n.language, status), value: status.code }))}
              required
              errorMessage={errorMessages['input-radio-marital-status-option-0']}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={editMode ? `/apply/${id}/review-information` : `/apply/${id}/date-of-birth`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('applicant-information.back-btn')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('applicant-information.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

import { useEffect } from 'react';

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
  socialInsuranceNumber: string;
  firstName: string;
  lastName: string;
  maritalStatus: string;
};

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.applicantInformation,
  pageTitleI18nKey: 'apply:applicant-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const maritalStatuses = await getLookupService().getAllMaritalStatuses();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:applicant-information.page-title') }) };

  return json({ id, maritalStatuses, meta, state: state.applicantInformation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema applicant information.
   */
  const applicantInformationSchema: z.ZodType<ApplicantInformationState> = z.object({
    socialInsuranceNumber: z
      .string()
      .trim()
      .refine(isValidSin, { message: t('apply:applicant-information.error-message.valid-sin') }),
    firstName: z
      .string()
      .trim()
      .min(1, { message: t('apply:applicant-information.error-message.first-name') }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: t('apply:applicant-information.error-message.last-name') }),
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('apply:applicant-information.error-message.marital-status') }) })
      .trim()
      .min(1, t('apply:applicant-information.error-message.marital-status')),
  });

  const formData = await request.formData();
  const data = {
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    maritalStatus: String(formData.get('maritalStatus') ?? ''),
  };
  const parsedDataResult = applicantInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: data as Partial<z.infer<typeof applicantInformationSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { applicantInformation: parsedDataResult.data },
  });

  if (['MARRIED', 'COMMONLAW'].includes(parsedDataResult.data.maritalStatus)) {
    return redirectWithLocale(request, `/apply/${id}/partner-information`, sessionResponseInit);
  }
  return redirectWithLocale(request, `/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, state, maritalStatuses } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  const defaultValues = {
    socialInsuranceNumber: fetcher.data?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    firstName: fetcher.data?.formData.firstName ?? state?.firstName ?? '',
    lastName: fetcher.data?.formData.lastName ?? state?.lastName ?? '',
    maritalStatus: fetcher.data?.formData.maritalStatus ?? state?.maritalStatus ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: fetcher.data?.errors.socialInsuranceNumber?._errors[0],
    firstName: fetcher.data?.errors.firstName?._errors[0],
    lastName: fetcher.data?.errors.lastName?._errors[0],
    'input-radios-marital-status': fetcher.data?.errors.maritalStatus?._errors[0],
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

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
              <InputField id="firstName" name="firstName" label={t('applicant-information.first-name')} className="w-full" required aria-labelledby="name-instructions" errorMessage={errorMessages.firstName} defaultValue={defaultValues.firstName} />
              <InputField id="lastName" name="lastName" label={t('applicant-information.last-name')} className="w-full" required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} aria-labelledby="name-instructions" />
            </div>
            <p id="name-instructions">{t('applicant-information.name-instructions')}</p>
            <InputField
              id="socialInsuranceNumber"
              name="socialInsuranceNumber"
              label={t('applicant-information.sin')}
              required
              inputMode="numeric"
              pattern="\d{9}"
              placeholder={formatSin('000000000', '-')}
              minLength={9}
              maxLength={9}
              defaultValue={defaultValues.socialInsuranceNumber}
              errorMessage={errorMessages.socialInsuranceNumber}
            />
            <InputRadios
              id="marital-status"
              name="maritalStatus"
              legend={t('applicant-information.marital-status')}
              options={maritalStatuses.map((status) => ({ defaultChecked: status.code === state?.maritalStatus, children: getNameByLanguage(i18n.language, status), value: status.code }))}
              required
              errorMessage={errorMessages['input-radios-marital-status']}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={`/apply/${id}/date-of-birth`} disabled={isSubmitting}>
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

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
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

export const applyIdParamSchema = z.string().uuid();

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.partnerInformation,
  pageTitleI18nKey: 'apply:partner-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  // TODO: the flow for where to redirect to will need to be determined depending on the state of the form
  if (!['MARRIED', 'COMMONLAW'].includes(state.applicantInformation?.maritalStatus ?? '')) {
    return redirectWithLocale(request, `/apply/${id}/contact-information`);
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:partner-information.page-title') }) };

  return json({ id, meta, state: state.partnerInformation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const partnerInformationSchema = z.object({
    socialInsuranceNumber: z
      .string()
      .refine(isValidSin, { message: 'valid-sin' })
      .refine((sin) => sin !== state.applicantInformation?.socialInsuranceNumber, { message: 'unique-sins' }),
    firstName: z.string().optional(),
    lastName: z.string().min(1, { message: 'last-name' }),
    month: z.coerce.number({ required_error: 'month' }).int().min(0, { message: 'month' }).max(11, { message: 'month' }),
    day: z.coerce.number({ required_error: 'day' }).int().min(1, { message: 'day' }).max(31, { message: 'day' }),
    year: z.coerce.number({ required_error: 'year' }).int().min(1, { message: 'year' }).max(new Date().getFullYear(), { message: 'year' }),
    confirm: z.string({ required_error: 'confirm' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = partnerInformationSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof partnerInformationSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { partnerInformation: parsedDataResult.data },
  });

  return redirectWithLocale(request, `/apply/${id}/personal-information`, sessionResponseInit);
}

export default function ApplyFlowApplicationInformation() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { id, state } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:partner-information.error-message.${errorI18nKey}` as any);
  }

  const defaultValues = {
    socialInsuranceNumber: fetcher.data?.formData.socialInsuranceNumber ?? state?.socialInsuranceNumber ?? '',
    firstName: fetcher.data?.formData.firstName ?? state?.firstName ?? '',
    lastName: fetcher.data?.formData.lastName ?? state?.lastName ?? '',
    month: fetcher.data?.formData.month ?? state?.month ?? '',
    day: fetcher.data?.formData.day ?? state?.day ?? '',
    year: fetcher.data?.formData.year ?? state?.year ?? '',
    confirm: fetcher.data?.formData.confirm ?? state?.confirm ?? '',
  };

  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(fetcher.data?.errors.socialInsuranceNumber?._errors[0]),
    lastName: getErrorMessage(fetcher.data?.errors.lastName?._errors[0]),
    month: getErrorMessage(fetcher.data?.errors.month?._errors[0]),
    day: getErrorMessage(fetcher.data?.errors.day?._errors[0]),
    year: getErrorMessage(fetcher.data?.errors.year?._errors[0]),
    'input-confirm-error': getErrorMessage(fetcher.data?.errors.confirm?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ children: new Intl.DateTimeFormat(`${i18n.language}-ca`, { month: 'long' }).format(new Date(2023, i, 1)), value: i, id: `month-${i}` }));

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
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <InputField id="firstName" name="firstName" className="w-full" label={t('applicant-information.first-name')} required aria-labelledby="name-instructions" defaultValue={defaultValues.firstName} />
              <InputField id="lastName" name="lastName" className="w-full" label={t('applicant-information.last-name')} required defaultValue={defaultValues.lastName} errorMessage={errorMessages.lastName} aria-labelledby="name-instructions" />
            </div>
            <p id="name-instructions">{t('partner-information.name-instructions')}</p>
            <fieldset>
              <legend className="mb-2 font-semibold">{t('partner-information.dob')}</legend>
              <div className="flex flex-col gap-6 sm:flex-row">
                {i18n.language === 'en' && (
                  <>
                    <InputSelect id="month" label={t('partner-information.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={defaultValues.month} />
                    <InputField id="day" label={t('partner-information.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={defaultValues.day} />
                  </>
                )}
                {i18n.language === 'fr' && (
                  <>
                    <InputField id="day" label={t('partner-information.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={defaultValues.day} />
                    <InputSelect id="month" label={t('partner-information.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={defaultValues.month} />
                  </>
                )}
                <InputField id="year" label={t('partner-information.year')} name="year" type="number" min={1900} errorMessage={errorMessages.year} defaultValue={defaultValues.year} />
              </div>
            </fieldset>
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
            <InputCheckbox id="confirm" name="confirm" required errorMessage={errorMessages['input-confirm-error']} defaultChecked={!!defaultValues.confirm}>
              {t('partner-information.confirm-checkbox')}
            </InputCheckbox>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={`/apply/${id}/applicant-information`} disabled={isSubmitting}>
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

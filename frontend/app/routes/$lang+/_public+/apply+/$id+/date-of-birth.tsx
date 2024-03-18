import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, createErrorSummaryItems, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { yearsBetween } from '~/utils/apply-utils';
import { parseDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type DateOfBirthState = string;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.dateOfBirth,
  pageTitleI18nKey: 'apply:eligibility.date-of-birth.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.date-of-birth.page-title') }) };

  return json({ id, meta, state: state.dateOfBirth });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const dateOfBirth = String(formData.get('dateOfBirth'));

  // state validation schema
  const dateOfBirthSchema: z.ZodType<DateOfBirthState> = z
    .string({
      invalid_type_error: t('apply:eligibility.date-of-birth.error-message.date-required'),
      required_error: t('apply:eligibility.date-of-birth.error-message.date-required'),
    })
    .min(1, { message: t('apply:eligibility.date-of-birth.error-message.date-required') })
    .refine(
      (val) => {
        const { year, month, day } = parseDateString(val);
        return year && month && day;
      },
      { message: t('apply:eligibility.date-of-birth.error-message.date-required') },
    );

  const parsedDataResult = dateOfBirthSchema.safeParse(dateOfBirth);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: dateOfBirth,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dateOfBirth: parsedDataResult.data },
  });

  const parsedDateString = parseDateString(parsedDataResult.data);
  const applicantDob = new Date(Number.parseInt(parsedDateString.year ?? ''), Number.parseInt(parsedDateString.month ?? ''), Number.parseInt(parsedDateString.day ?? ''));
  const age = yearsBetween(new Date(), applicantDob);

  if (age < 65) {
    return redirectWithLocale(request, `/apply/${id}/dob-eligibility`, sessionResponseInit);
  }

  return redirectWithLocale(request, `/apply/${id}/applicant-information`, sessionResponseInit);
}

export default function ApplyFlowDateOfBirth() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, state } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  useEffect(() => {
    if (fetcher.data?.formData && fetcher.data.errors._errors.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  const errorMessages = {
    'date-picker-date-of-birth-month': fetcher.data?.errors._errors[0],
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <div className="max-w-prose">
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p className="mb-6">{t('apply:eligibility.date-of-birth.description')}</p>
      <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
        <DatePickerField id="date-of-birth" name="dateOfBirth" defaultValue={state ?? ''} legend={t('apply:eligibility.date-of-birth.form-instructions')} required errorMessage={errorMessages['date-picker-date-of-birth-month']} />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/tax-filing`} disabled={isSubmitting}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:eligibility.date-of-birth.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={isSubmitting}>
            {t('apply:eligibility.date-of-birth.continue-btn')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}

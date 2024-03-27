import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { differenceInYears, isValid, parse } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { DatePickerField } from '~/components/date-picker-field';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
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

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.date-of-birth.page-title') }) };

  return json({ id, meta, defaultState: state.dateOfBirth, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dateOfBirthSchema: z.ZodType<DateOfBirthState> = z
    .string()
    .trim()
    .min(1, { message: t('apply:eligibility.date-of-birth.error-message.date-of-birth-required-and-valid') })
    .refine((val) => isValid(parse(val, 'yyyy-MM-dd', new Date())), { message: t('apply:eligibility.date-of-birth.error-message.date-of-birth-required-and-valid') });

  const formData = await request.formData();
  const data = String(formData.get('dateOfBirth') ?? '');
  const parsedDataResult = dateOfBirthSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const sessionResponseInit = await applyFlow.saveState({ params, request, session, state: { dateOfBirth: parsedDataResult.data } });

  const parseDateOfBirth = parse(parsedDataResult.data, 'yyyy-MM-dd', new Date());
  const age = differenceInYears(new Date(), parseDateOfBirth);

  if (age < 65) {
    return redirectWithLocale(request, `/apply/${id}/dob-eligibility`, sessionResponseInit);
  }

  return redirectWithLocale(request, state.editMode ? `/apply/${id}/review-information` : `/apply/${id}/applicant-information`, sessionResponseInit);
}

export default function ApplyFlowDateOfBirth() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, defaultState, editMode } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'date-picker-date-of-birth-month': fetcher.data?.errors._errors[0],
    }),
    [fetcher.data?.errors._errors],
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
        <Progress aria-labelledby="progress-label" value={30} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p className="mb-6">{t('apply:eligibility.date-of-birth.description')}</p>
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <DatePickerField id="date-of-birth" name="dateOfBirth" defaultValue={defaultState ?? ''} legend={t('apply:eligibility.date-of-birth.form-instructions')} required errorMessage={errorMessages['date-picker-date-of-birth-month']} />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={editMode ? `/apply/${id}/review-information` : `/apply/${id}/tax-filing`} disabled={isSubmitting}>
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
    </>
  );
}

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
import { InputLegend } from '~/components/input-legend';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { yearsBetween } from '~/utils/apply-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

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

  return json({ id, meta, state: state.dob });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.dobSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.dobSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dob: parsedDataResult.data },
  });
  const applicantDob = new Date(parsedDataResult.data.year, parsedDataResult.data.month, parsedDataResult.data.day);
  return yearsBetween(new Date(), applicantDob) >= 65 ? redirectWithLocale(request, `/apply/${id}/applicant-information`, sessionResponseInit) : redirectWithLocale(request, `/apply/${id}/dob-eligibility`, sessionResponseInit);
}

export default function ApplyFlowDateOfBirth() {
  const { id, state } = useLoaderData<typeof loader>();

  const errorSummaryId = 'error-summary';
  const fetcher = useFetcher<typeof action>();

  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:eligibility.date-of-birth.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    day: getErrorMessage(fetcher.data?.errors.day?._errors[0]),
    month: getErrorMessage(fetcher.data?.errors.month?._errors[0]),
    year: getErrorMessage(fetcher.data?.errors.year?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ children: new Intl.DateTimeFormat(`${i18n.language}-ca`, { month: 'long' }).format(new Date(2023, i, 1)), value: i, id: `month-${i}` }));

  return (
    <div className="max-w-prose">
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p className="mb-6">{t('apply:eligibility.date-of-birth.description')}</p>
      <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
        <InputLegend id="dobLegend" required className="mb-2">
          {t('apply:eligibility.date-of-birth.form-instructions')}
        </InputLegend>
        <div className="flex flex-col gap-6 sm:flex-row">
          <InputSelect id="month" label={t('apply:eligibility.date-of-birth.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={state?.month} />
          <InputField id="day" label={t('apply:eligibility.date-of-birth.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={state?.day} />
          <InputField id="year" label={t('apply:eligibility.date-of-birth.year')} name="year" type="number" min={1900} errorMessage={errorMessages.year} defaultValue={state?.year} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/tax-filing`} disabled={fetcher.state !== 'idle'}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:eligibility.date-of-birth.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={fetcher.state !== 'idle'}>
            {t('apply:eligibility.date-of-birth.continue-btn')}
            <FontAwesomeIcon icon={fetcher.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', fetcher.state !== 'idle' && 'animate-spin')} />
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}

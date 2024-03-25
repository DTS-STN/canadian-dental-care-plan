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
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum TaxFilingOption {
  No = 'no',
  Yes = 'yes',
}

export type TaxFilingState = `${TaxFilingOption}`;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.taxFiling,
  pageTitleI18nKey: 'apply:eligibility.tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.tax-filing.page-title') }) };

  return json({ id, meta, defaultState: state.taxFiling2023 });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema: z.ZodType<TaxFilingState> = z.nativeEnum(TaxFilingOption, {
    errorMap: () => ({ message: t('apply:eligibility.tax-filing.error-message.tax-filing-required') }),
  });

  const formData = await request.formData();
  const data = formData.get('taxFiling2023');
  const parsedDataResult = taxFilingSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  const sessionResponseInit = await applyFlow.saveState({ request, params, state: { taxFiling2023: parsedDataResult.data } });

  if (parsedDataResult.data === TaxFilingOption.No) {
    return redirectWithLocale(request, `/apply/${id}/file-your-taxes`, sessionResponseInit);
  }

  return redirectWithLocale(request, `/apply/${id}/date-of-birth`, sessionResponseInit);
}

export default function ApplyFlowTaxFiling() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, defaultState } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-tax-filing-2023-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
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
        <Progress aria-labelledby="progress-label" value={20} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <InputRadios
            id="tax-filing-2023"
            name="taxFiling2023"
            legend={t('apply:eligibility.tax-filing.form-instructions')}
            options={[
              { value: TaxFilingOption.Yes, children: t('apply:eligibility.tax-filing.radio-options.yes'), defaultChecked: defaultState === TaxFilingOption.Yes },
              { value: TaxFilingOption.No, children: t('apply:eligibility.tax-filing.radio-options.no'), defaultChecked: defaultState === TaxFilingOption.No },
            ]}
            required
            errorMessage={errorMessages['input-radio-tax-filing-2023-option-0']}
          />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={`/apply/${id}/type-of-application`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:eligibility.tax-filing.back-btn')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('apply:eligibility.tax-filing.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

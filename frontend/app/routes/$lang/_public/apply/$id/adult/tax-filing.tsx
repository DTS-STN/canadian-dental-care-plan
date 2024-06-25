import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum TaxFilingOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.taxFiling,
  pageTitleI18nKey: 'apply-adult:eligibility.tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:eligibility.tax-filing.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.taxFiling2023 });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult/tax-filing');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.nativeEnum(TaxFilingOption, {
    errorMap: () => ({ message: t('apply-adult:eligibility.tax-filing.error-message.tax-filing-required') }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = formData.get('taxFiling2023');
  const parsedDataResult = taxFilingSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  saveApplyState({ params, session, state: { taxFiling2023: parsedDataResult.data === TaxFilingOption.Yes } });

  if (parsedDataResult.data === TaxFilingOption.No) {
    return redirect(getPathById('$lang/_public/apply/$id/adult/file-taxes', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/adult/date-of-birth', params));
}

export default function ApplyFlowTaxFiling() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
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

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="tax-filing-2023"
            name="taxFiling2023"
            legend={t('apply-adult:eligibility.tax-filing.form-instructions')}
            options={[
              { value: TaxFilingOption.Yes, children: t('apply-adult:eligibility.tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TaxFilingOption.No, children: t('apply-adult:eligibility.tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errorMessages['input-radio-tax-filing-2023-option-0']}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Tax filing click">
              {t('apply-adult:eligibility.tax-filing.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/type-application" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Tax filing click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-adult:eligibility.tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

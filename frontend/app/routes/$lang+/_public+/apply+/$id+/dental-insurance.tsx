import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export type DentalInsuranceState = string;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.dentalInsurance,
  pageTitleI18nKey: 'apply:dental-insurance.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const lookupService = getLookupService();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const options = await lookupService.getAllAccessToDentalInsuranceOptions();

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:dental-insurance.title') }) };

  return json({ id, meta, options, defaultState: state.dentalInsurance, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema: z.ZodType<DentalInsuranceState> = z
    .string({ errorMap: () => ({ message: t('apply:dental-insurance.error-message.dental-insurance-required') }) })
    .trim()
    .min(1, t('apply:dental-insurance.error-message.dental-insurance-required'));

  const formData = await request.formData();
  const dentalInsurance = String(formData.get('dentalInsurance') ?? '');
  const parsedDataResult = dentalInsuranceSchema.safeParse(dentalInsurance);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  const sessionResponseInit = await applyFlow.saveState({ params, request, session, state: { dentalInsurance: parsedDataResult.data } });
  return redirectWithLocale(request, state.editMode ? `/apply/${id}/review-information` : `/apply/${id}/federal-provincial-territorial-benefits`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { options, defaultState, id, editMode } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-dental-insurance-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  const helpMessage = (
    <ul className="mb-6 list-disc space-y-1 pl-7">
      <li>{t('dental-insurance.list.employment')}</li>
      <li>{t('dental-insurance.list.pension')}</li>
      <li>{t('dental-insurance.list.purchased')}</li>
      <li>{t('dental-insurance.list.professional')}</li>
      <li className="list-none">
        <Collapsible summary={t('dental-insurance.detail.additional-info.title')} className="mt-4">
          <div className="space-y-4">
            <p>{t('dental-insurance.detail.additional-info.not-eligible')}</p>
            <p>{t('dental-insurance.detail.additional-info.not-eligible-purchased')}</p>
            <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('dental-insurance.detail.additional-info.list.opted')}</li>
              <li>{t('dental-insurance.detail.additional-info.list.cannot-opt')}</li>
            </ul>
          </div>
        </Collapsible>
      </li>
    </ul>
  );

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={80} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          {options.length > 0 && (
            <div className="my-6">
              <InputRadios
                id="dental-insurance"
                name="dentalInsurance"
                legend={t('dental-insurance.legend')}
                options={options.map((option) => ({
                  children: <Trans ns={handle.i18nNamespaces}>{`dental-insurance.option-${option.id}`}</Trans>,
                  value: option.id,
                  defaultChecked: defaultState === option.id,
                }))}
                helpMessagePrimary={helpMessage}
                helpMessagePrimaryClassName="text-black"
                required
                errorMessage={errorMessages['input-radio-dental-insurance-option-0']}
              />
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to={editMode ? `/apply/${id}/review-information` : `/apply/${id}/communication-preference`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('dental-insurance.button.back')}
            </ButtonLink>
            <Button variant="primary">
              {t('dental-insurance.button.continue')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}

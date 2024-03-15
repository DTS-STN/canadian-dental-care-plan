import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:eligibility.tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.tax-filing.page-title') }) };

  return json({ id, meta, state: state.taxFiling2023 });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.taxFilingSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.taxFilingSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { taxFiling2023: parsedDataResult.data },
  });

  return parsedDataResult.data.taxFiling2023 === 'FALSE' ? redirectWithLocale(request, `/apply/${id}/file-your-taxes`, sessionResponseInit) : redirectWithLocale(request, `/apply/${id}/date-of-birth`, sessionResponseInit);
}

export default function ApplyFlowTaxFiling() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';
  const navigation = useNavigation();

  const { t } = useTranslation(handle.i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:eligibility.tax-filing.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    'input-radios-tax-filing-2023': getErrorMessage(actionData?.errors.taxFiling2023?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="mt-6 max-w-prose">
        <InputRadios
          id="tax-filing-2023"
          name="taxFiling2023"
          legend={t('apply:eligibility.tax-filing.form-instructions')}
          options={[
            { value: 'TRUE', children: t('apply:eligibility.tax-filing.radio-options.yes'), defaultChecked: state?.taxFiling2023 === 'TRUE' },
            { value: 'FALSE', children: t('apply:eligibility.tax-filing.radio-options.no'), defaultChecked: state?.taxFiling2023 === 'FALSE' },
          ]}
          required={errorSummaryItems.length > 0}
          errorMessage={errorMessages['input-radios-tax-filing-2023']}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/type-of-application`} className={cn(navigation.state !== 'idle' && 'pointer-events-none')}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:eligibility.tax-filing.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={navigation.state !== 'idle'}>
            {t('apply:eligibility.tax-filing.continue-btn')}
            <FontAwesomeIcon icon={navigation.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', navigation.state !== 'idle' && 'animate-spin')} />
          </Button>
        </div>
      </Form>
    </>
  );
}

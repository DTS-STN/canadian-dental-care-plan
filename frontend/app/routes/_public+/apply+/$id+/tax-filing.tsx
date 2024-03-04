import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('eligibility');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'eligibility:breadcrumbs.canada-ca', to: '/personal-information' },
    { labelI18nKey: 'eligibility:breadcrumbs.benefits' },
    { labelI18nKey: 'eligibility:breadcrumbs.dental-coverage' },
    { labelI18nKey: 'eligibility:breadcrumbs.canadian-dental-care-plan' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:tax-filing.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  return json({ id, state: state.taxFiling2023 });
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

  if (['FALSE'].includes(parsedDataResult.data.taxFiling2023)) {
    return redirect(`/apply/${id}/file-your-taxes`, sessionResponseInit);
  }
  return redirect(`/apply/${id}/date-of-birth`, sessionResponseInit);
}

export default function ApplyFlowTaxFiling() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`eligibility:tax-filing.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    taxFiling2023: getErrorMessage(actionData?.errors.taxFiling2023?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <>
      <br />
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
        <InputRadios
          id="tax-filing-2023"
          name="taxFiling2023"
          legend={t('tax-filing.form-instructions')}
          options={[
            { value: 'TRUE', children: t('tax-filing.radio-options.yes'), defaultChecked: state?.taxFiling2023 === 'TRUE' },
            { value: 'FALSE', children: t('tax-filing.radio-options.no'), defaultChecked: state?.taxFiling2023 === 'FALSE' },
          ]}
          required={errorSummaryItems.length > 0}
          errorMessage={errorMessages.taxFiling2023}
        />
        <br />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={'/apply/' + id + '/type-of-application'}>
            {t('back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </ButtonLink>
          <Button type="submit" variant="primary">
            {t('continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}

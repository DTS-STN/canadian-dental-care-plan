import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, MetaFunction, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:eligibility.type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('apply:eligibility.type-of-application.page-title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  return json({ id, state: state.applicationDelegate });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.typeOfApplicationSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.typeOfApplicationSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { applicationDelegate: parsedDataResult.data },
  });

  return parsedDataResult.data.applicationDelegate === 'TRUE' ? redirect(`/apply/${id}/application-delegate`, sessionResponseInit) : redirect(`/apply/${id}/tax-filing`, sessionResponseInit);
}

export default function ApplyFlowTypeOfApplication() {
  const { state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(handle.i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:eligibility.type-of-application.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    applicationDelegate: getErrorMessage(actionData?.errors.applicationDelegate?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="mt-6 max-w-prose">
        <InputRadios
          id="application-delegate"
          name="applicationDelegate"
          legend={t('apply:eligibility.type-of-application.form-instructions')}
          options={[
            { value: 'FALSE', children: t('apply:eligibility.type-of-application.radio-options.personal'), defaultChecked: state?.applicationDelegate === 'FALSE' },
            { value: 'TRUE', children: t('apply:eligibility.type-of-application.radio-options.delegate'), defaultChecked: state?.applicationDelegate === 'TRUE' },
          ]}
          required={errorSummaryItems.length > 0}
          errorMessage={errorMessages.applicationDelegate}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/apply">
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:eligibility.type-of-application.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button">
            {t('apply:eligibility.type-of-application.continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}

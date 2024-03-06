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
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:type-of-application.page-title',
} as const satisfies RouteHandleData;

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

  const { t } = useTranslation(i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`eligibility:type-of-application.error-message.${errorI18nKey}` as any);
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
          legend={t('type-of-application.form-instructions')}
          options={[
            { value: 'FALSE', children: t('type-of-application.radio-options.personal'), defaultChecked: state?.applicationDelegate === 'FALSE' },
            { value: 'TRUE', children: t('type-of-application.radio-options.delegate'), defaultChecked: state?.applicationDelegate === 'TRUE' },
          ]}
          required={errorSummaryItems.length > 0}
          errorMessage={errorMessages.applicationDelegate}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to="/apply">
            {t('type-of-application.back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </ButtonLink>
          <Button type="submit" variant="primary">
            {t('type-of-application.continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}

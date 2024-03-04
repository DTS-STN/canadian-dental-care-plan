import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getIntakeFlow } from '~/routes-flow/intake-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const intakeIdParamSchema = z.string().uuid();

const i18nNamespaces = getTypedI18nNamespaces('eligibility');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'eligibility:type-of-application.breadcrumbs.canada-ca', to: '/personal-information' },
    { labelI18nKey: 'eligibility:type-of-application.breadcrumbs.benefits' },
    { labelI18nKey: 'eligibility:type-of-application.breadcrumbs.dental-coverage' },
    { labelI18nKey: 'eligibility:type-of-application.breadcrumbs.canadian-dental-care-plan' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:type-of-application.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id, state } = await intakeFlow.loadState({ request, params });

  return json({ id, state: state.applicationDelegate });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id } = await intakeFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = intakeFlow.typeOfApplicationSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof intakeFlow.typeOfApplicationSchema>>,
    });
  }

  const sessionResponseInit = await intakeFlow.saveState({
    request,
    params,
    state: { applicationDelegate: parsedDataResult.data },
  });

  if (['TRUE'].includes(parsedDataResult.data.applicationDelegate)) {
    return redirect(`/intake/${id}/application-delegate`, sessionResponseInit);
  }
  return redirect(`/intake/${id}/tax-filing`, sessionResponseInit);
}

export default function IntakeFlowTypeOfApplication() {
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
      <br />
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
        <InputRadios
          id="application-delegate"
          name="applicationDelegate"
          legend={t('type-of-application.form-instructions')}
          options={[
            { value: 'FALSE', children: t('type-of-application.radio-options.personal'), defaultChecked: state?.applicationDelegate === 'FALSE' },
            { value: 'TRUE', children: t('type-of-application.radio-options.delegate'), defaultChecked: state?.applicationDelegate === 'TRUE' },
          ]}
          required
          errorMessage={errorMessages.applicationDelegate}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="alternative">{t('type-of-application.back-btn')}</Button>
          <Button variant="primary">{t('type-of-application.continue-btn')}</Button>
        </div>
      </Form>
    </>
  );
}

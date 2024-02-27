import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getIntakeFlow } from '~/routes-flow/intake-flow';

export const intakeIdParamSchema = z.string().uuid();

export async function loader({ request, params }: LoaderFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id, state } = await intakeFlow.loadState({ request, params });
  return json({ id, state: state.email });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id } = await intakeFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = intakeFlow.emailStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof intakeFlow.emailStateSchema>>,
    });
  }

  const sessionResponseInit = await intakeFlow.saveState({
    request,
    params,
    state: { email: parsedDataResult.data },
  });

  return redirect(`/intake/${id}/confirm`, sessionResponseInit);
}

export default function IntakeFlowEmail() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const defaultValues = {
    emailAddress: actionData?.formData.emailAddress ?? state?.emailAddress ?? '',
  };

  const errorMessages = {
    emailAddress: actionData?.errors.emailAddress?._errors[0],
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <h3>Intake Form Flow Index: {id}</h3>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p className="mb-3 font-semibold">State:</p>
      <pre className="mb-6 block max-w-prose border border-slate-100 bg-slate-50 p-3">{JSON.stringify(state, undefined, 2)}</pre>
      <Form method="post">
        <InputField id="emailAddress" name="emailAddress" label="Email address" required defaultValue={defaultValues.emailAddress} errorMessage={errorMessages.emailAddress} />
        <Button variant="primary">Next step</Button>
      </Form>
    </>
  );
}

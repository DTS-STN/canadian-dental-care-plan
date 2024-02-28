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
  return json({ id, state: state.personalInfo });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id } = await intakeFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = intakeFlow.personalInfoStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof intakeFlow.personalInfoStateSchema>>,
    });
  }

  const sessionResponseInit = await intakeFlow.saveState({
    request,
    params,
    state: { personalInfo: parsedDataResult.data },
  });

  return redirect(`/intake/${id}/email`, sessionResponseInit);
}

export default function IntakeFlowPersonalInfo() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const defaultValues = {
    age: actionData?.formData.age ?? state?.age ?? '',
    givenName: actionData?.formData.givenName ?? state?.givenName ?? '',
    surname: actionData?.formData.surname ?? state?.surname ?? '',
  };

  const errorMessages = {
    age: actionData?.errors.age?._errors[0],
    givenName: actionData?.errors.givenName?._errors[0],
    surname: actionData?.errors.surname?._errors[0],
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
        <InputField id="givenName" name="givenName" label="Given Name" required defaultValue={defaultValues.givenName} errorMessage={errorMessages.givenName} />
        <InputField id="surname" name="surname" label="Surname" required defaultValue={defaultValues.surname} errorMessage={errorMessages.surname} />
        <InputField id="age" name="age" label="Age" type="number" min={0} required defaultValue={defaultValues.age} errorMessage={errorMessages.age} />
        <Button variant="primary">Next step</Button>
      </Form>
    </>
  );
}

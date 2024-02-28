import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { redirectWithSuccess } from 'remix-toast';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { getIntakeFlow } from '~/routes-flow/intake-flow';

export const intakeIdParamSchema = z.string().uuid();

export async function loader({ request, params }: LoaderFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const { id, state } = await intakeFlow.loadState({ request, params });
  return json({ id, state });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  await intakeFlow.loadState({ request, params });
  const sessionResponseInit = await intakeFlow.clearState({ request, params });
  return redirectWithSuccess('/', 'Form Submitted!', sessionResponseInit);
}

export default function IntakeFlowConfirm() {
  const { id, state } = useLoaderData<typeof loader>();

  return (
    <>
      <h3>Intake Form Flow Index: {id}</h3>
      <p className="mb-3 font-semibold">State:</p>
      <pre className="mb-6 block max-w-prose border border-slate-100 bg-slate-50 p-3">{JSON.stringify(state, undefined, 2)}</pre>
      <Form method="post" noValidate>
        <Button variant="primary">Submit</Button>
      </Form>
    </>
  );
}

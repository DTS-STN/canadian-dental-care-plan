import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { randomUUID } from 'crypto';

import { Button } from '~/components/buttons';
import { getIntakeFlow } from '~/routes-flow/intake-flow';

export async function action({ request }: ActionFunctionArgs) {
  const intakeFlow = getIntakeFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await intakeFlow.start({ id, request });
  return redirect(`/intake/${id}/personal-info`, sessionResponseInit);
}

export default function IntakeIndex() {
  return (
    <>
      <h3>Intake Form Index</h3>
      <p>Privacy Statements</p>
      <Form method="post">
        <Button>Accept and start intake flow!</Button>
      </Form>
    </>
  );
}

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { getIntakeFlow } from '~/routes-flow/intake-flow';
import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { HCAPTCHA_SITE_KEY } = getEnv();
  return { siteKey: HCAPTCHA_SITE_KEY };
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    'h-captcha-response': z.string().min(1, { message: 'Please indicate that you are human.' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const hCaptchaService = await getHCaptchaService();
  const hCaptchaResponse = parsedDataResult.data['h-captcha-response'];
  const hCaptchaResult = await hCaptchaService.verifyHCaptchaResponse(hCaptchaResponse);

  // TODO handle the hCaptchaResult (eg. log the result or redirect to another page)
  console.log(hCaptchaResult);

  const intakeFlow = getIntakeFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await intakeFlow.start({ id, request });

  return redirect(`/intake/${id}/personal-info`, sessionResponseInit);
}

export default function IntakeIndex() {
  const { siteKey } = useLoaderData<typeof loader>();

  return (
    <>
      <h3>Intake Form Index</h3>
      <p>Privacy Statements</p>
      <Form method="post" noValidate>
        <HCaptcha sitekey={siteKey} />
        <Button>Accept and start intake flow!</Button>
      </Form>
    </>
  );
}

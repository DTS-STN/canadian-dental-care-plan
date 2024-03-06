import { FormEvent, useRef } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { Form, useLoaderData, useSubmit } from '@remix-run/react';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env.server';
import { mergeMeta } from '~/utils/meta-utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const { HCAPTCHA_SITE_KEY } = getEnv();
  return { siteKey: HCAPTCHA_SITE_KEY };
}

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  return [{ name: 'robots', content: 'index' }];
});

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

  const applyFlow = getApplyFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await applyFlow.start({ id, request });
  return redirect(`/apply/${id}/terms-and-conditions`, sessionResponseInit);
}

export default function ApplyIndex() {
  const { siteKey } = useLoaderData<typeof loader>();
  const captchaRef = useRef<HCaptcha>(null);
  const submit = useSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRef.current) {
      const formData = new FormData(event.currentTarget);
      const { response } = await captchaRef.current.execute({ async: true });
      formData.set('h-captcha-response', response);
      submit(formData, { method: 'POST' });

      captchaRef.current.resetCaptcha();
    }
  }

  return (
    <>
      <h3>Apply Form Index</h3>
      <p>Privacy Statements</p>
      <Form method="post" onSubmit={handleSubmit} noValidate>
        <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />
        <Button>Accept and start apply flow!</Button>
      </Form>
    </>
  );
}

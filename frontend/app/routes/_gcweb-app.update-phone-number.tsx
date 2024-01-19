import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { z } from 'zod';
import { PhoneNumber } from '~/components/phone-number';

import { getUserService } from '~/services/user-service.server';
import { commitSession, getSession } from '~/sessions';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const { getUserId, getUserInfo } = getUserService({ env });
  const userId = await getUserId();
  return json({
    userInfo: await getUserInfo(userId),
  });
}

export async function action({ request }: ActionFunctionArgs) {

  const isPhoneNumber = (val: string) => val.match(/\([0-9]{3}\) [0-9]{3}-[0-9]{4}/);

  const formDataSchema = z.object({
    phoneNumber: z.string().refine(isPhoneNumber, { message: 'Invalid phone number' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const session = await getSession(
    request.headers.get("Cookie")
  );
  
  session.set('newPhoneNumber', parsedDataResult.data.phoneNumber)

  return redirect('/update-phone-number-confirm', { headers: {
    "Set-Cookie": await commitSession(session),
  }});
}

export default function UpdateInfo() {

  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const fieldErrors = actionData?.errors;

  return (
    <>
      <h1 id="wb-cont" property="name">
        Update phone number
      </h1>
      <p>Please update your phone number below.</p>
      <Form method="post">
        <div className="form-group">
          <PhoneNumber editMode phoneNumber={actionData?.formData.phoneNumber ?? loaderData.userInfo.phoneNumber} fieldErrors={fieldErrors?.phoneNumber?._errors}/>
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg">Save</button>
        </div>
      </Form>
    </>
  );
}

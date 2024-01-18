import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { z } from 'zod';

import { userService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const { getUserId, getUserInfo } = userService({ env });
  const userId = await getUserId();
  return json({
    userInfo: await getUserInfo(userId),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const env = getEnv();
  const { getUserId, updateUserInfo } = userService({ env });

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

  const userInfo = parsedDataResult.data;
  const userId = await getUserId();
  await updateUserInfo(userId, userInfo);

  return redirect('/update-info-success');
}

export default function UpdateInfo() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const fieldErrors = actionData?.errors;

  return (
    <>
      <h1 id="wb-cont" property="name">
        Update personal info
      </h1>
      <p>Please update your info below.</p>
      <Form method="post">
        <div className="form-group">
          <label htmlFor="phoneNumber" className="required">
            <span className="field-name">Phone number</span>
            <strong className="required mrgn-lft-sm">(required)</strong>
            {fieldErrors?.phoneNumber?._errors &&
              fieldErrors.phoneNumber._errors.map((error, idx) => (
                <span key={idx} className="label label-danger wb-server-error">
                  <strong>
                    <span className="prefix">Error:</span>
                    <span className="mrgn-lft-sm">{error}</span>
                  </strong>
                </span>
              ))}
          </label>
          <input id="phoneNumber" name="phoneNumber" className="form-control" maxLength={32} defaultValue={actionData?.formData.phoneNumber ?? loaderData.userInfo.phoneNumber} data-testid="phoneNumber" />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg">Update info</button>
        </div>
      </Form>
    </>
  );
}

import { type ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { z } from 'zod';

import { type UserInfo, getUserInfo, updateUserInfo } from '~/services/user-info-client';

export default function UpdateInfo() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const fielderrors = actionData?.errors.fieldErrors;

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
            {fielderrors?.phoneNumber && (
              <span className="label label-danger wb-server-error">
                <strong>
                  <span className="prefix">Error 1:</span>
                  <span className="mrgn-lft-sm">{fielderrors.phoneNumber}</span>
                </strong>
              </span>
            )}
          </label>
          <input id="phoneNumber" name="phoneNumber" className="form-control" maxLength={32} defaultValue={actionData?.formData.phoneNumber ?? loaderData.phoneNumber} data-testid="phoneNumber" />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg">Update info</button>
        </div>
      </Form>
    </>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const isPhoneNumber = (val: string) => val.match(/\([0-9]{3}\) [0-9]{3}-[0-9]{4}/);

  const formDataSchema = z.object({
    phoneNumber: z.string().refine(isPhoneNumber, { message: 'Invalid phone number' }),
  });

  const formData = Object.fromEntries(await request.formData()) as UserInfo;
  const validFormData = formDataSchema.safeParse(formData);

  if (!validFormData.success) {
    return json({
      errors: validFormData.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  await updateUserInfo('1234', formData);
  return redirect('/update-info-success');
}

export async function loader() {
  const { phoneNumber } = await getUserInfo('1234');
  return json({ phoneNumber });
}

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { isValidPhoneNumber } from 'libphonenumber-js';

import { z } from 'zod';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {

  const formDataSchema = z.object({
    phoneNumber: z.string().refine((val) => isValidPhoneNumber(val, 'CA'), { message: 'Invalid phone number' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const session = await sessionService.getSession(request.headers.get('Cookie'));  
  session.set('newPhoneNumber', parsedDataResult.data.phoneNumber)

  return redirect('/personal-information/phone-number/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PhoneNumberEdit() {
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
          <label htmlFor="phoneNumber" className={'required'}>
            <span className="field-name">Phone number</span>
            <strong className="required mrgn-lft-sm">(required)</strong>
            {fieldErrors?.phoneNumber?._errors &&
              fieldErrors?.phoneNumber?._errors.map((error, idx) => (
                <span key={idx} className="label label-danger wb-server-error">
                  <strong>
                    <span className="prefix">Error:</span>
                    <span className="mrgn-lft-sm">{error}</span>
                  </strong>
                </span>
              ))}
          </label>
          <input id="phoneNumber" name="phoneNumber" className="form-control" maxLength={32} defaultValue={actionData?.formData.phoneNumber ?? loaderData.userInfo?.phoneNumber} data-testid="phoneNumber" />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">Save</button>
          <Link id="cancelButton" to="/personal-information" className="btn btn-default btn-lg">
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}

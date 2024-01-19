import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData, useNavigate } from '@remix-run/react';

import { z } from 'zod';
import { PhoneNumber } from '~/components/phone-number';

import { getUserService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const { getUserId, getUserInfo } = getUserService({ env });

  const userId = await getUserId();
  const userInfo = await getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404, statusText: 'User Info Not Found' });
  }

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const env = getEnv();
  const userService = getUserService({ env });

  const isPhoneNumber = (val: string) => /\(\d{3}\) \d{3}-\d{4}/.exec(val);

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
  const userId = await userService.getUserId();
  await userService.updateUserInfo(userId, userInfo);

  return redirect('/update-info-success');
}

export default function UpdateInfo() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const fieldErrors = actionData?.errors;

  const navigate = useNavigate();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Update personal info
      </h1>
      <p>Please update your info below.</p>
        <div className="form-group">
          <PhoneNumber phoneNumber={actionData?.formData.phoneNumber ?? loaderData.userInfo.phoneNumber} fieldErrors={fieldErrors?.phoneNumber?._errors}/>
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/update-phone-number")}>Edit</button>
        </div>
    </>
  );
}

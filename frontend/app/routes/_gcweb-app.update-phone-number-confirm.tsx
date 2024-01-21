import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { PhoneNumber } from '~/components/phone-number';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, newPhoneNumber: await session.get('newPhoneNumber') });
}

export async function action({ request }: ActionFunctionArgs) {
  //TODO: API call to POST phone number

  return redirect('/update-phone-number-success');
}

export default function UpdatePhoneNumberConfirm() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Confirm phone number
      </h1>
      <p>Please confirm the phone number change below.</p>
      <Form method="post">
        <div className="form-group">
          <PhoneNumber phoneNumber={loaderData.newPhoneNumber ?? ''} previousPhoneNumber={loaderData.userInfo?.phoneNumber} />
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg mrgn-rght-sm">Confirm</button>
          <Link id="cancelButton" to="/update-info" className="btn btn-default btn-lg">
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}

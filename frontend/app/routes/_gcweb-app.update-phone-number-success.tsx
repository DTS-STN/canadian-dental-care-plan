import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { PhoneNumber } from '~/components/phone-number';
import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function UpdatePhoneNumberSuccess() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Phone number saved sucecssfully
      </h1>
      <p>Phone number has been successfully updated</p>
      <div className="form-group">
        <PhoneNumber phoneNumber={loaderData.userInfo?.phoneNumber} />
      </div>
      <div className="form-group">
        <Link id="successPhoneButton" to="/update-info" className="btn btn-primary btn-lg">
          Return to personal info
        </Link>
      </div>
    </>
  );
}

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function PhoneNumberSuccess() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Phone number saved sucecssfully
      </h1>
      <p>Phone number has been successfully updated</p>
      <div>
        <dl>
          <dt>Phone number</dt>
          <dd>{loaderData.userInfo?.phoneNumber}</dd>
        </dl>
      </div>
      <div>
        <Link id="successPhoneButton" to="/personal-information" className="btn btn-primary btn-lg">
          Return to personal info
        </Link>
      </div>
    </>
  );
}

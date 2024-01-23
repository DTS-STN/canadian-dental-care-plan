import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}


export default function UpdateInfo() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Update personal info
      </h1>
      <p>Please update your info below.</p>
      <div >
        <dl>
          <dt>Phone number</dt>
          <dd>{loaderData.userInfo.phoneNumber}</dd>
        </dl>
      </div>
      <div>
        <Link id="editPhoneButton" to="/personal-information/phone-number/edit" className="btn btn-primary btn-lg">
          Edit
        </Link>
      </div>
    </>
  );
}

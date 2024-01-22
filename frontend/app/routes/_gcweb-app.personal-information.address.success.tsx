import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ userInfo });
}

export default function UpdateAddressSuccess() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Address saved successfully
      </h1>
      <p>Address has been successfully updated</p>

      <div className="row mrgn-tp-sm">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">Home address</h3>
            </header>
            <div className="panel-body">
              <p>{loaderData.userInfo?.homeAddress}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="row mrgn-tp-sm">
        <div className="col-sm-6">
          <section className="panel panel-info">
            <header className="panel-heading">
              <h3 className="panel-title">Mailing address</h3>
            </header>
            <div className="panel-body">
              <p>{loaderData.userInfo?.mailingAddress}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="form-group">
        <Link id="successPhoneButton" to="/personal-information" className="btn btn-primary btn-lg">
          Return to personal info
        </Link>
      </div>
    </>
  );
}

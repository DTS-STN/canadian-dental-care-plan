import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, newAddress: await session.get('newAddress') });
}

export default function ConfirmAddress() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Change address
      </h1>
      <p className="h3">Confirm</p>
      <Form method="post">
        <strong>Change of Home Address</strong>
        <div className="row mrgn-tp-sm">
          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">From:</h3>
              </header>
              <div className="panel-body">
                <p>{loaderData.userInfo?.homeAddress}</p>
              </div>
            </section>
          </div>

          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">To:</h3>
              </header>
              <div className="panel-body">
                <p>{loaderData.newAddress?.homeAddress}</p>
              </div>
            </section>
          </div>
        </div>

        <strong>Change of Mailing Address</strong>
        <div className="row mrgn-tp-sm">
          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">From:</h3>
              </header>
              <div className="panel-body">
                <p>{loaderData.userInfo?.mailingAddress}</p>
              </div>
            </section>
          </div>

          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h3 className="panel-title">To:</h3>
              </header>
              <div className="panel-body">
                <p>{loaderData.newAddress?.mailingAddress}</p>
              </div>
            </section>
          </div>
        </div>

        <div className="form-group">
          <ul className="list-inline lst-spcd">
            <li>
              <button id="confirm-button" className="btn btn-primary btn-lg">
                Confirm
              </button>
            </li>
            <li>
              <Link id="cancel-button" to="/personal-information/address/edit" className="btn btn-default btn-lg">
                Cancel
              </Link>
            </li>
          </ul>
        </div>
      </Form>
    </>
  );
}

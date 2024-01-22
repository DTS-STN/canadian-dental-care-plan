import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  return json({ userInfo, newAddress: await session.get('newAddress') });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await userService.getUserId();
  const session = await sessionService.getSession(request.headers.get('Cookie'));

  await userService.updateUserInfo(userId, session.get('newAddress'));

  return redirect('/personal-information/address/success');
}

export default function ConfirmAddress() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Change address
      </h1>
      <h2 className="h3">Confirm</h2>
      <Form method="post">
        <h3>Change of Home Address</h3>
        <div className="row mrgn-tp-sm">
          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h4 className="panel-title">From:</h4>
              </header>
              <div className="panel-body">
                <p>{loaderData.userInfo?.homeAddress}</p>
              </div>
            </section>
          </div>

          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h4 className="panel-title">To:</h4>
              </header>
              <div className="panel-body">
                <p>{loaderData.newAddress?.homeAddress}</p>
              </div>
            </section>
          </div>
        </div>

        <h3>Change of Mailing Address</h3>
        <div className="row mrgn-tp-sm">
          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h4 className="panel-title">From:</h4>
              </header>
              <div className="panel-body">
                <p>{loaderData.userInfo?.mailingAddress}</p>
              </div>
            </section>
          </div>

          <div className="col-sm-6">
            <section className="panel panel-info">
              <header className="panel-heading">
                <h4 className="panel-title">To:</h4>
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

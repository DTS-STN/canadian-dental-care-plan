import { Form, Link, useLoaderData } from '@remix-run/react';

import { type LoaderFunctionArgs, type ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { getUserService } from '~/services/user-service.server';
import { commitSession, getSession } from '~/sessions';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const userService = getUserService({ env });
  const userId = await userService.getUserId();
  return json({
    user: await userService.getUserInfo(userId),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = Object.fromEntries(await request.formData());

  const session = await getSession(
    request.headers.get("Cookie")
  );

  session.set('newAddress', {homeAddress: formData.homeAddress.toString(), mailingAddress: formData.mailingAddress.toString()});


  return redirect('/personal-information/address/confirm', { headers: {
    "Set-Cookie": await commitSession(session),
  }});
}

export default function ChangeAddress() {
  const { user } = useLoaderData<typeof loader>();

  const defaultValues = {
    homeAddress: user?.homeAddress ?? '',
    mailingAddress: user?.mailingAddress ?? ''
  };

  return (
    <>
      <h1 id="wb-cont" property="name">
        Change address
      </h1>
      <Form method="post">
        <div className="form-group">
          <label htmlFor="home-address" className="required">
            Home address <strong className="text-danger">(required)</strong>
          </label>
          <input id="home-address" name="homeAddress" className="form-control" size={60} defaultValue={defaultValues.homeAddress}/>
        </div>

        <div className="form-group">
          <label htmlFor="mailing-address" className="required">
            Mailing address <strong className="text-danger">(required)</strong>
          </label>
          <input id="mailing-address" name="mailingAddress" className="form-control" size={60} defaultValue={defaultValues.mailingAddress}/>
        </div>

        <div className="form-group">
          <ul className="list-inline lst-spcd">
            <li>
              <button id="change-button" className="btn btn-primary btn-lg">Change</button>
            </li>
            <li>
              <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">Cancel</Link>
            </li>
          </ul>
        </div>
      </Form>
    </>
  );
}

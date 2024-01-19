import { Form, Link, useLoaderData } from '@remix-run/react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';

import { getUserService } from '~/services/user-service.server';
import { getSession } from "~/sessions";
import { getEnv } from '~/utils/env.server';

//export async function loader({ request }: LoaderFunctionArgs) {
  //const env = getEnv();
 // const userService = getUserService({ env });
 // const userId = await userService.getUserId();
 // return json({
 //   user: await userService.getUserInfo(userId),
 // });

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const { getUserId, getUserInfo } = getUserService({ env });
  const userId = await getUserId();
  const session = await getSession(
    request.headers.get("Cookie")
  );
  console.log(await session.get('newAddress'));

  return json({
    userInfo: await getUserInfo(userId),
    newAddress: await session.get('newAddress')
  });
} 

export default function ConfirmAddress() {
  const loaderData  = useLoaderData<typeof loader>();

  return (
    <>
      <h1 id="wb-cont" property="name">
        Change address
      </h1>
      <p className="h3">Confirm</p>
      <Form method="post">
        <strong>Change of Home Address</strong>
        <div className="row">
			    <div className="col-sm-6">
				    <section className="panel panel-info">
					    <header className="panel-heading">
						    <h3 className="panel-title">
							    <span className="pull-right"></span>
                  From:
						    </h3>
					    </header>
					    <div className="panel-body">
						    <p>{loaderData.userInfo?.homeAddress}</p>
					    </div>
				    </section>
			    </div>

			    <div className="col-sm-6">
				    <section className="panel panel-info">
					    <header className="panel-heading">
						    <h3 className="panel-title">
							    <span className="pull-right"></span>
                  To:
						    </h3>
					    </header>
					    <div className="panel-body">
						    <p>{loaderData.newAddress?.homeAddress}</p>
					    </div>
				    </section>
			    </div>          
		    </div>

        <strong>Change of Mailing Address</strong>
        <div className="row">
			    <div className="col-sm-6">
				    <section className="panel panel-info">
					    <header className="panel-heading">
						    <h3 className="panel-title">
							    <span className="pull-right"></span>
                  From:
						    </h3>
					    </header>
					    <div className="panel-body">
                <p>{loaderData.userInfo?.mailingAddress}</p>
					    </div>
				    </section>
			    </div>

			    <div className="col-sm-6">
				    <section className="panel panel-info">
					    <header className="panel-heading">
						    <h3 className="panel-title">
							    <span className="pull-right"></span>
                  To:
						    </h3>
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
              <button id="confirm-button" className="btn btn-primary btn-lg">Confirm</button>
            </li>
            <li>
              <Link id="cancel-button" to="/personal-information/address/edit" className="btn btn-default btn-lg">Cancel</Link>
            </li>
          </ul>
        </div>
      </Form>
    </>
  );
}

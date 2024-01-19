import type { ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { PhoneNumber } from "~/components/phone-number";
import { getUserService } from "~/services/user-service.server";
import { getSession } from "~/sessions";
import { getEnv } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const env = getEnv();
    const { getUserId, getUserInfo } = getUserService({ env });
    const userId = await getUserId();
    const session = await getSession(
      request.headers.get("Cookie")
    );
    return json({
      userInfo: await getUserInfo(userId),
      newPhoneNumber: await session.get('newPhoneNumber')
    });
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
            <PhoneNumber phoneNumber={loaderData.newPhoneNumber ?? ''} previousPhoneNumber={loaderData.userInfo.phoneNumber}/>
          </div>
          <div className="form-group">
            <button className="btn btn-primary btn-lg">Confirm</button>
          </div>
        </Form>
      </>
    );
  }
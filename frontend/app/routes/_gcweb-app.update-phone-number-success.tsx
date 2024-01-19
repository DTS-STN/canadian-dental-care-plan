import type { LoaderFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { PhoneNumber } from "~/components/phone-number";
import { getUserService } from "~/services/user-service.server";
import { getEnv } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const env = getEnv();
    const { getUserId, getUserInfo } = getUserService({ env });
    const userId = await getUserId();
    return json({
      userInfo: await getUserInfo(userId),
    });
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
          <PhoneNumber phoneNumber={loaderData.userInfo?.phoneNumber}/>
        </div>
        <div className="form-group">
          <Link id="successPhoneButton" to="/update-info" className="btn btn-default btn-lg">Return to personal info</Link>
        </div>
      </>
    );
  }
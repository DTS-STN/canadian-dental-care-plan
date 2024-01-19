import type { LoaderFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
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

export default function UpdatePhoneNumberConfirm() {
  
    let navigate = useNavigate();
    const loaderData = useLoaderData<typeof loader>();

    return (
      <>
        <h1 id="wb-cont" property="name">
          Phone number saved sucessfully 
        </h1>
        <p>Phone number has been sucessfully updated</p>
        <div className="form-group">
          <PhoneNumber phoneNumber={loaderData.userInfo.phoneNumber}/>
        </div>
        <div className="form-group">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/update-info")}>Return to personal info</button>
        </div>
      </>
    );
  }
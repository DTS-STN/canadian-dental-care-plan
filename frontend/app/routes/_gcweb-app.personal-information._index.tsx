import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { getUserService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const userService = getUserService({ env });
  const userId = await userService.getUserId();
  return json({
    user: await userService.getUserInfo(userId),
  });
}

export default function PersonalInformationIndex() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <>
      <p>Personal information! 😎</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
}

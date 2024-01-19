import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { getUserService } from '~/services/user-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:personal-information.breadcrumbs.home', to: '/' }, { labelI18nKey: 'common:personal-information.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0003',
  pageTitleI18nKey: 'common:personal-information.page-title',
} as const satisfies RouteHandleData;

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

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('common');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:personal-information.breadcrumbs.home', to: '/' }, { labelI18nKey: 'common:personal-information.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0003',
  pageTitleI18nKey: 'common:personal-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  return json({ user: userInfo });
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

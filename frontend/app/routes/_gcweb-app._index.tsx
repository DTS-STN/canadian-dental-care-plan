import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

import { LandingPageLink } from '~/components/landing-page-link';

const i18nNamespaces = getTypedI18nNamespaces('common', 'gcweb');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'common:index.breadcrumbs.home' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0001',
  pageTitleI18nKey: 'common:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function Index() {
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('common:index.page-title')}
      </h1>
      <p>
        Welcome {userInfo.firstName} {userInfo.lastName}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <LandingPageLink title="Update Your Information" description="In this section, you can your personal information." to="/update-info">
          Update your information
        </LandingPageLink>
        <LandingPageLink title="Upload Document" description="In this section, you can your upload documents." to="/upload-document">
          Upload document for CDCP
        </LandingPageLink>
        <LandingPageLink title="Personal Information" description="In this section, you can see your personal information." to="/personal-information">
          Personal information
        </LandingPageLink>
        <LandingPageLink title="View my Letters" description="In this section, you can see any letters that were sent for you." to="/view-letters">
          View My Letters
        </LandingPageLink>
        <LandingPageLink title="View my messages" description="In this section, you can see any messages that were sent to you." to="/messages">
          View My CDCP Messages
        </LandingPageLink>
        <LandingPageLink title="CDCP alerts" description="In this section, you can subscribe to the email alerts for CDCO, Any time you have a new message, you will be alerted." to="/alert-me">
          Subscribe to CDCP email alerts
        </LandingPageLink>
      </div>
      <h2>LEGACY LINKS</h2>
      <ul className="list-unstyled">
        <li>
          <Link to="/personal-information">Personal information</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/not-found">404 not found page</Link>
        </li>
        <li>
          <Link to="/error">500 internal server error page</Link>
        </li>
      </ul>
    </>
  );
}

import { useEffect } from 'react';

import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams } from '@remix-run/react';

import { randomUUID } from 'crypto';
import invariant from 'tiny-invariant';

import { TYPES } from '~/.server/constants';
import { startProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { UserinfoToken } from '~/.server/utils/raoidc.utils';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.public.apply.index,
  pageTitleI18nKey: 'protected-renew:terms-and-conditions.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const userInfoToken = session.get<UserinfoToken>('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.domain.services.ApplicationYearService);
  const applicationYear = await applicationYearService.findRenewalApplicationYear({ date: currentDate, userId: userInfoToken.sub });
  invariant(applicationYear?.renewalYearId, 'Expected applicationYear.renewalYearId to be defined'); // TODO this should redirect to the protected apply flow when introduced

  const clientApplicationService = appContainer.get(TYPES.domain.services.ClientApplicationService);
  const clientApplication = await clientApplicationService.findClientApplicationBySin({ sin: userInfoToken.sin, applicationYearId: applicationYear.intakeYearId, userId: userInfoToken.sub });
  if (!clientApplication) {
    throw redirect(getPathById('protected/data-unavailable'));
  }

  const id = randomUUID().toString();
  const state = startProtectedRenewState({
    applicationYear: {
      intakeYearId: applicationYear.intakeYearId,
      renewalYearId: applicationYear.renewalYearId,
      taxYear: applicationYear.taxYear,
      coverageStartDate: applicationYear.coverageStartDate,
    },
    clientApplication,
    id,
    session,
  });

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:index.page-title') }) };

  return { id: state.id, locale, meta };
}

export default function ProtectedRenewIndex() {
  const { id } = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();

  const path = getPathById('protected/renew/$id/terms-and-conditions', { ...params, id });

  useEffect(() => {
    sessionStorage.setItem('protected.renew.state', 'active');
    navigate(path, { replace: true });
  }, [navigate, path]);

  return (
    <div className="max-w-prose animate-pulse">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-full rounded bg-gray-200"></div>
          <div className="h-5 w-full rounded bg-gray-200"></div>
          <div className="h-5 w-2/3 rounded bg-gray-200"></div>
        </div>
        <div className="h-5 w-1/2 rounded bg-gray-200"></div>
        <div className="h-5 w-1/2 rounded bg-gray-200"></div>
      </div>
      <div className="my-8 space-y-2">
        <div className="h-5 w-full rounded bg-gray-200"></div>
        <div className="h-5 w-2/3 rounded bg-gray-200"></div>
      </div>
      <div className="h-10 w-2/5 rounded bg-gray-200"></div>
    </div>
  );
}

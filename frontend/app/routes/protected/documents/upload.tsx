import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import type { Option } from 'oxide.ts';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/upload';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'documents:index.page-title', routeId: 'protected/documents/index' }],
  i18nNamespaces: getTypedI18nNamespaces('documents', 'gcweb'),
  pageIdentifier: pageIds.protected.documents.upload,
  pageTitleI18nKey: 'documents:upload.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const locale = getLocale(request);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  // TODO: Add client number check in security handler
  const clientNumberOption: Option<string> = session.has('clientNumber')
    ? session.find('clientNumber')
    : await appContainer.get(TYPES.ApplicantService).findClientNumberBySin({
        sin: userInfoToken.sin,
        userId: userInfoToken.sub,
      });

  if (clientNumberOption.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientNumber = clientNumberOption.unwrap();
  session.set('clientNumber', clientNumber);

  const evidentiaryDocumentTypeService = appContainer.get(TYPES.EvidentiaryDocumentTypeService);
  const localizedEvidentiaryDocumentTypes = await evidentiaryDocumentTypeService.listLocalizedEvidentiaryDocumentTypes(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('documents:upload.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.documents-upload', { userId: idToken.sub });

  return {
    meta,
    documentTypes: localizedEvidentiaryDocumentTypes,
    SCCH_BASE_URI,
  };
}

export default function DocumentsUpload({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { SCCH_BASE_URI } = loaderData;

  return (
    <div className="space-y-8">
      <div>Form inputs go here</div>
      <div>
        <LoadingButton id="submit-button" variant="primary">
          {t('documents:upload.submit')}
        </LoadingButton>
      </div>
      <div>
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

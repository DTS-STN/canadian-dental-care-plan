import { Activity } from 'react';

import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import type { Option } from 'oxide.ts';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/table';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'documents:index.page-title' }],
  i18nNamespaces: getTypedI18nNamespaces('documents', 'gcweb'),
  pageIdentifier: pageIds.protected.documents.index,
  pageTitleI18nKey: 'documents:index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

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

  const applicantDocumentService = appContainer.get(TYPES.ApplicantDocumentService);
  const documents = await applicantDocumentService.listApplicantDocuments({ clientNumber, userId: userInfoToken.sub });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('documents:index.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.documents', { userId: idToken.sub });

  return { meta, documents, SCCH_BASE_URI };
}

export default function LettersIndex({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { documents, SCCH_BASE_URI } = loaderData;
  const hasDocuments = documents.length > 0;
  return (
    <div className="space-y-6">
      <p>{hasDocuments ? t('documents:index.has-documents') : t('documents:index.no-documents')}</p>
      <Activity mode={hasDocuments ? 'visible' : 'hidden'}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('documents:index.table-headers.file-name')}</TableHead>
              <TableHead>{t('documents:index.table-headers.member-id')}</TableHead>
              <TableHead>{t('documents:index.table-headers.type-of-document')}</TableHead>
              <TableHead>{t('documents:index.table-headers.date-uploaded')}</TableHead>
              <TableHead>{t('documents:index.table-headers.date-received')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id} className="odd:bg-white even:bg-gray-50">
                <TableCell>{document.fileName}</TableCell>
                <TableCell>
                  <span className="block">{`${document.firstName} ${document.lastName}`.trim()}</span>
                  <span className="text-nowrap">{document.clientNumber}</span>
                </TableCell>
                <TableCell>{document.documentType}</TableCell>
                <TableCell className="text-nowrap">{new Date(document.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-nowrap">{document.receivedAt ? new Date(document.receivedAt).toLocaleDateString() : t('documents:index.received-status-pending')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Activity>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

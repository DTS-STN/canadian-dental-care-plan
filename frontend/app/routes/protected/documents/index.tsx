import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/index';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { ButtonLink } from '~/components/buttons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/table';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('documents', 'gcweb'),
  pageIdentifier: pageIds.protected.documents.index,
  pageTitleI18nKey: 'documents:index.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const locale = getLocale(request);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const clientNumber = await securityHandler.requireClientNumber({ params, request, session });

  const evidentiaryDocumentService = appContainer.get(TYPES.EvidentiaryDocumentService);
  const evidentiaryDocumentTypeService = appContainer.get(TYPES.EvidentiaryDocumentTypeService);
  const evidentiaryDocuments = await evidentiaryDocumentService.listEvidentiaryDocuments({ clientID: clientNumber, userId: userInfoToken.sub });
  const localizedEvidentiaryDocumentTypes = await evidentiaryDocumentTypeService.listLocalizedEvidentiaryDocumentTypes(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('documents:index.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.documents', { userId: idToken.sub });

  const { TIME_ZONE } = appContainer.get(TYPES.ClientConfig);
  const dateFormatter = new Intl.DateTimeFormat(`${locale}-CA`, { timeZone: TIME_ZONE, dateStyle: 'long' });

  return {
    meta,
    documents: evidentiaryDocuments.map((document) => {
      return {
        ...document,
        documentTypeName: localizedEvidentiaryDocumentTypes.find(({ id }) => id === document.documentTypeId)?.name ?? '',
        mscaUploadDateFormatted: dateFormatter.format(new Date(document.mscaUploadDate)),
        healthCanadaTransferDateFormatted: document.healthCanadaTransferDate ? dateFormatter.format(new Date(document.healthCanadaTransferDate)) : undefined,
      };
    }),
    SCCH_BASE_URI,
  };
}

export default function DocumentsIndex({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { documents, SCCH_BASE_URI } = loaderData;
  const hasDocuments = documents.length > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p>{hasDocuments ? t('documents:index.has-documents') : t('documents:index.no-documents')}</p>
        {hasDocuments && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documents:index.table-headers.file-name')}</TableHead>
                <TableHead>{t('documents:index.table-headers.applicant')}</TableHead>
                <TableHead>{t('documents:index.table-headers.type-of-document')}</TableHead>
                <TableHead>{t('documents:index.table-headers.date-uploaded')}</TableHead>
                <TableHead>{t('documents:index.table-headers.date-received')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id} className="odd:bg-white even:bg-gray-50">
                  <TableCell className="max-w-[200px] break-all">{document.fileName}</TableCell>
                  <TableCell>{document.name}</TableCell>
                  <TableCell>{document.documentTypeName}</TableCell>
                  <TableCell className="text-nowrap">{document.mscaUploadDateFormatted}</TableCell>
                  <TableCell className="text-nowrap">{document.healthCanadaTransferDateFormatted ?? t('documents:index.received-status-pending')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div>
        <ButtonLink id="upload-button" routeId="protected/documents/upload" params={params} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Upload documents - Submitted documents click">
          {t('documents:index.upload-documents')}
        </ButtonLink>
      </div>
      <div>
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Return to dashboard - Submitted documents click">
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

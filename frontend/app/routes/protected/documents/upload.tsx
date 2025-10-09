import { useMemo, useState } from 'react';

import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import { filesize } from 'filesize';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/upload';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { FileUpload, FileUploadItem, FileUploadItemDelete, FileUploadList, FileUploadTrigger } from '~/components/file-upload';
import { InputLegend } from '~/components/input-legend';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
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
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const locale = getLocale(request);

  const applicantNames = [`${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`, ...clientApplication.children.map((c) => `${c.information.firstName} ${c.information.lastName}`)].map((name) =>
    name.trim(),
  );

  const evidentiaryDocumentTypeService = appContainer.get(TYPES.EvidentiaryDocumentTypeService);
  const localizedEvidentiaryDocumentTypes = await evidentiaryDocumentTypeService.listLocalizedEvidentiaryDocumentTypes(locale);

  // TODO: fetch from API
  const reasons = [{ id: '1', name: 'Member Eligibility Review' }];

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('documents:upload.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.documents-upload', { userId: idToken.sub });

  return {
    meta,
    applicantNames,
    documentTypes: localizedEvidentiaryDocumentTypes,
    reasons,
    SCCH_BASE_URI,
  };
}

export default function DocumentsUpload({ loaderData, params }: Route.ComponentProps) {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { applicantNames, documentTypes, reasons, SCCH_BASE_URI } = loaderData;

  const [files, setFiles] = useState<File[]>([]);

  const applicantOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...applicantNames.map((name) => ({ children: name, value: name }))];
  }, [applicantNames, t]);

  const reasonOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...reasons.map((reason) => ({ children: reason.name, value: reason.id }))];
  }, [reasons, t]);

  const documentTypeOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...documentTypes.map(({ id, name }) => ({ children: name, value: id }))];
  }, [documentTypes, t]);

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-6">
        <InputSelect id="applicant" name="applicant" label="Whoe are you uploading for" required className="w-full" options={applicantOptions} defaultValue="" />
        <InputSelect id="reason" name="reason" label="Reason for file upload" required className="w-full" options={reasonOptions} defaultValue="" />
        <fieldset>
          <InputLegend className="mb-2">Upload document</InputLegend>
          <p>You can upload up to 10 files at once.</p>
          <p className="mb-2">Maximum file size is 5MB. File types accepted: .docx, .ppt, .txt, .pdf, .jpg, .jpeg, .png</p>
          <FileUpload
            value={files}
            onValueChange={(f) => {
              setFiles(f);
            }}
            multiple={false}
            className="gap-4 sm:gap-6"
          >
            <div>
              <FileUploadTrigger asChild>
                <Button startIcon={faArrowUpFromBracket}>Add file</Button>
              </FileUploadTrigger>
            </div>
            <FileUploadList className="gap-4 sm:gap-6">
              {files.map((file, index) => (
                <FileUploadItem key={`${index}_${file.name}`} value={file} className="flex-col items-stretch gap-3 sm:gap-4">
                  <dl className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <dt className="font-semibold">File name</dt>
                      <dd>{file.name}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="font-semibold">File size</dt>
                      <dd>{filesize(file.size, { locale: `${i18n.language}-CA` })}</dd>
                    </div>
                  </dl>
                  <InputSelect id={`document-type-${index}`} name="documentType" label="Document Type" required className="w-full" options={documentTypeOptions} defaultValue="" />
                  <div className="mt-2 text-right">
                    <FileUploadItemDelete asChild>
                      <Button variant="outline-red" size="sm" endIcon={faTimes}>
                        Remove
                      </Button>
                    </FileUploadItemDelete>
                  </div>
                </FileUploadItem>
              ))}
            </FileUploadList>
          </FileUpload>
        </fieldset>
      </div>
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

import { useMemo, useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { TFunction } from 'i18next';
import { getI18n, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/upload';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import { TYPES } from '~/.server/constants';
import type { DocumentUploadService } from '~/.server/domain/services';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import type { ErrorFieldMap } from '~/components/error-summary';
import { useErrorSummary } from '~/components/error-summary';
import { FileUpload, FileUploadItem, FileUploadItemDelete, FileUploadList, FileUploadTrigger } from '~/components/file-upload';
import { InputError } from '~/components/input-error';
import { InputLegend } from '~/components/input-legend';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getClientEnv } from '~/utils/env-utils';
import { getFileExtension, getMimeType } from '~/utils/file.utils';
import { getLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { randomHexString } from '~/utils/string-utils';
import { bytesToFilesize, megabytesToBytes } from '~/utils/units.utils';

type UploadErrors = {
  applicant?: string;
  files?: string;
  fileItems?: Record<number, { file?: string; documentType?: string }>;
};

type ParsedUploadData = {
  applicant: string;
  files: { file: File; documentType: string }[];
};

type CreateDocumentUploadSchemaArgs = {
  locale: string;
  t: TFunction<typeof handle.i18nNamespaces>;
  validFileExtensions: ReadonlyArray<string>;
  maxFileSizeInMB: number;
  maxFileCount: number;
};

type FileWithDocumentType = { id: string; file: File; documentType: string };

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'documents:index.page-title', routeId: 'protected/documents/index' }],
  i18nNamespaces: getTypedI18nNamespaces('documents', 'gcweb'),
  pageIdentifier: pageIds.protected.documents.upload,
  pageTitleI18nKey: 'documents:upload.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('doc-upload');
  await securityHandler.validateAuthSession({ request, session });

  const clientApplication = await securityHandler.requireClientApplication({
    params,
    request,
    session,
    options: { redirectUrl: getPathById('protected/documents/not-required', params) },
  });

  const locale = getLocale(request);
  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicants: Array<{ clientId: string; name: string }> = [
    { clientId: clientApplication.applicantInformation.clientId, name: `${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`.trim() },
    ...clientApplication.children.map((c) => ({ clientId: c.information.clientId, name: `${c.information.firstName} ${c.information.lastName}`.trim() })),
  ];

  const documentTypes = await appContainer.get(TYPES.EvidentiaryDocumentTypeService).listLocalizedEvidentiaryDocumentTypes(locale);

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);
  const idToken: IdToken = session.get('idToken');

  appContainer.get(TYPES.AuditService).createAudit('page-view.documents-upload', { userId: idToken.sub });

  return {
    meta: { title: t('gcweb:meta.title.msca-template', { title: t('documents:upload.page-title') }) },
    applicants,
    documentTypes,
    SCCH_BASE_URI,
  };
}

export async function clientAction({ request, serverAction }: Route.ClientActionArgs) {
  const formData = await request.clone().formData();
  const locale = getLanguage(request);
  const t = getI18n().getFixedT(locale, handle.i18nNamespaces);
  const env = getClientEnv();

  const validationResult = validateUploadForm(formData, locale, t, {
    allowedExtensions: env.DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS,
    maxSizeMB: env.DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
    maxCount: env.DOCUMENT_UPLOAD_MAX_FILE_COUNT,
  });

  if (!validationResult.success) {
    return { errors: validationResult.errors };
  }

  return await serverAction();
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('doc-upload');
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });

  const clientApplication = await securityHandler.requireClientApplication({
    params,
    request,
    session,
    options: { redirectUrl: getPathById('protected/documents/not-required', params) },
  });

  const clientIdToNumberMap: ReadonlyMap<string, string> = new Map<string, string>([
    [clientApplication.applicantInformation.clientId, clientApplication.applicantInformation.clientNumber] as const,
    ...clientApplication.children.map((c) => [c.information.clientId, c.information.clientNumber] as const),
  ]);

  const locale = getLocale(request);
  const t = await getFixedT(locale, handle.i18nNamespaces);
  const config = appContainer.get(TYPES.ClientConfig);
  const idToken: IdToken = session.get('idToken');

  const validationResult = validateUploadForm(formData, locale, t, {
    allowedExtensions: config.DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS,
    maxSizeMB: config.DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
    maxCount: config.DOCUMENT_UPLOAD_MAX_FILE_COUNT,
  });

  if (!validationResult.success) {
    return { errors: validationResult.errors };
  }

  const { applicant, files } = validationResult.data;
  const uploadService = appContainer.get(TYPES.DocumentUploadService);

  const scanResult = await scanDocuments(files, idToken.sub, uploadService, t);
  if (!scanResult.success) {
    return { errors: scanResult.errors };
  }

  const clientNumber = clientIdToNumberMap.get(applicant);
  invariant(clientNumber, 'Client number not found for client ID: ' + applicant);
  const uploadResult = await uploadDocuments({ clientNumber, files: files, service: uploadService, t, userId: idToken.sub });

  if (!uploadResult.success) {
    return { errors: uploadResult.errors };
  }

  await createMetadata({ appContainer, clientId: applicant, files, userId: idToken.sub });

  return redirect(getPathById('protected/documents/index', params));
}

function validateUploadForm(
  formData: FormData,
  locale: string,
  t: TFunction<typeof handle.i18nNamespaces>,
  config: { allowedExtensions: readonly string[]; maxSizeMB: number; maxCount: number },
): { success: true; data: ParsedUploadData } | { success: false; errors: UploadErrors } {
  const rawFiles = formData.getAll('files') as File[];
  const documentTypes = formData.getAll('documentTypes') as string[];

  const filesWithTypes = rawFiles.map((file, index) => ({
    file,
    documentType: documentTypes[index] ?? '',
  }));

  const schema = createDocumentUploadSchema({
    locale,
    t,
    validFileExtensions: config.allowedExtensions,
    maxFileSizeInMB: config.maxSizeMB,
    maxFileCount: config.maxCount,
  });

  const result = schema.safeParse({
    applicant: formData.get('applicant'),
    files: filesWithTypes,
  });

  if (!result.success) {
    return { success: false, errors: mapZodErrors(result.error) };
  }

  return { success: true, data: result.data as ParsedUploadData };
}

async function scanDocuments(files: ParsedUploadData['files'], userId: string, service: DocumentUploadService, t: TFunction<typeof handle.i18nNamespaces>): Promise<{ success: boolean; errors?: UploadErrors }> {
  const promises = files.map(async ({ file }, index) => {
    try {
      const response = await service.scanDocument({
        fileName: file.name,
        binary: Buffer.from(await file.arrayBuffer()).toString('base64'),
        userId,
      });

      if (response.Error) {
        return { index, error: t('documents:upload.error-message.scan-failed', { error: response.Error.ErrorMessage }) };
      }
      return { index, success: true };
    } catch {
      return { index, error: t('documents:upload.error-message.scan-error') };
    }
  });

  const results = await Promise.all(promises);
  return processBatchResults(results);
}

interface UploadDocumentsRequestArgs {
  clientNumber: string;
  files: ParsedUploadData['files'];
  userId: string;
  service: DocumentUploadService;
  t: TFunction<typeof handle.i18nNamespaces>;
}

interface UploadDocumentsResponseArgs {
  success: boolean;
  errors?: UploadErrors;
}

async function uploadDocuments({ clientNumber, files, service, t, userId }: UploadDocumentsRequestArgs): Promise<UploadDocumentsResponseArgs> {
  const promises = files.map(async ({ file, documentType }, index) => {
    try {
      const response = await service.uploadDocument({
        clientNumber,
        evidentiaryDocumentTypeId: documentType,
        fileName: file.name,
        binary: Buffer.from(await file.arrayBuffer()).toString('base64'),
        uploadDate: new Date(),
        userId,
      });

      if (response.Error) {
        return { index, error: t('documents:upload.error-message.upload-failed', { error: response.Error.ErrorMessage }) };
      }
      return { index, success: true };
    } catch {
      return { index, error: t('documents:upload.error-message.upload-error') };
    }
  });

  const results = await Promise.all(promises);
  return processBatchResults(results);
}

function processBatchResults(results: { index: number; error?: string }[]): { success: boolean; errors?: UploadErrors } {
  const failures = results.filter((r) => r.error);
  if (failures.length === 0) return { success: true };

  const errors: UploadErrors = { fileItems: {} };
  for (const { index, error } of failures) {
    if (errors.fileItems) errors.fileItems[index] = { file: error };
  }
  return { success: false, errors };
}

interface CreateMetadataArgs {
  appContainer: AppContainerProvider;
  clientId: string;
  files: ParsedUploadData['files'];
  userId: string;
}

async function createMetadata({ appContainer, clientId, files, userId }: CreateMetadataArgs) {
  const reasons = await appContainer.get(TYPES.DocumentUploadReasonService).listDocumentUploadReasons();
  const reasonId = reasons[0].id;
  const recordSource = Number(appContainer.get(TYPES.ServerConfig).EWDU_RECORD_SOURCE_MSCA);
  const evidentiaryDocumentService = appContainer.get(TYPES.EvidentiaryDocumentService);
  return await evidentiaryDocumentService.createEvidentiaryDocumentMetadata({
    clientId: clientId,
    documents: files.map(({ file, documentType }) => ({
      fileName: file.name,
      evidentiaryDocumentTypeId: documentType,
      documentUploadReasonId: reasonId,
      recordSource,
      uploadDate: new Date(),
    })),
    userId: userId,
  });
}

function createDocumentUploadSchema({ locale, t, validFileExtensions, maxFileSizeInMB, maxFileCount }: CreateDocumentUploadSchemaArgs) {
  const MAX_FILE_SIZE = megabytesToBytes(maxFileSizeInMB);
  const ALLOWED_EXTENSIONS = new Set(validFileExtensions);
  const ALLOWED_MIME_TYPES = validFileExtensions.map(getMimeType);

  const fileSchema = z.object({
    file: z
      .file(t('documents:upload.error-message.file-required'))
      .max(MAX_FILE_SIZE, t('documents:upload.error-message.file-too-large', { filesize: bytesToFilesize(MAX_FILE_SIZE, `${locale}-CA`) }))
      .refine((file) => ALLOWED_EXTENSIONS.has(getFileExtension(file.name)), t('documents:upload.error-message.invalid-file-type', { extensions: [...ALLOWED_EXTENSIONS].join(', ') }))
      .mime(ALLOWED_MIME_TYPES, t('documents:upload.error-message.invalid-file-type', { extensions: [...ALLOWED_EXTENSIONS].join(', ') })),
    documentType: z.string().min(1, t('documents:upload.error-message.document-type-required')),
  });

  return z.object({
    applicant: z.string(t('documents:upload.error-message.applicant-required')).trim().min(1, t('documents:upload.error-message.applicant-required')),
    files: z
      .array(fileSchema) //
      .min(1, t('documents:upload.error-message.file-required'))
      .max(maxFileCount, t('documents:upload.error-message.too-many-files', { count: maxFileCount })),
  });
}

function mapZodErrors(zodError: z.ZodError): UploadErrors {
  const errors: UploadErrors = {};
  for (const issue of zodError.issues) {
    const { message, path } = issue;
    if (path[0] === 'applicant') {
      errors.applicant = message;
    } else if (path[0] === 'files') {
      if (path.length === 1) {
        errors.files = message;
      } else {
        const index = path[1] as number;
        const field = path[2] as 'file' | 'documentType';
        errors.fileItems ??= {};
        errors.fileItems[index] ??= {};
        errors.fileItems[index][field] = message;
      }
    }
  }
  return errors;
}

export default function DocumentsUpload({ loaderData, params }: Route.ComponentProps) {
  const { t, i18n } = useTranslation(handle.i18nNamespaces);
  const { applicants, documentTypes, SCCH_BASE_URI } = loaderData;
  const env = useClientEnv();
  const { DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS, DOCUMENT_UPLOAD_MAX_FILE_COUNT } = env;

  const fetcher = useFetcher<{ errors: UploadErrors }>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [filesWithTypes, setFilesWithTypes] = useState<FileWithDocumentType[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFilesWithTypes((currentItems) => {
      const currentMap = new Map(currentItems.map((item) => [getFileKey(item.file), item]));
      const newItems = [];

      for (const file of newFiles) {
        const key = getFileKey(file);
        if (currentMap.has(key)) {
          newItems.push(currentMap.get(key) as FileWithDocumentType);
        } else {
          newItems.push({ id: randomHexString(8), file, documentType: '' });
        }
      }
      const uniqueItems = new Map(newItems.map((item) => [getFileKey(item.file), item]));
      return [...uniqueItems.values()];
    });
  };

  const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete('files');
    formData.delete('documentTypes');

    for (const { file, documentType } of filesWithTypes) {
      formData.append('files', file);
      formData.append('documentTypes', documentType);
    }

    await fetcher.submit(formData, { method: 'post', encType: 'multipart/form-data' });
  };

  const applicantOptions = useMemo<InputOptionProps[]>(() => {
    return [
      { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true }, //
      ...applicants.map(({ clientId, name }) => ({ children: name, value: clientId })),
    ];
  }, [applicants, t]);

  const docTypeOptions = useMemo<InputOptionProps[]>(() => {
    return [
      { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true }, //
      ...documentTypes.map((d) => ({ children: d.name, value: d.id })),
    ];
  }, [documentTypes, t]);

  const errorFieldMap = useMemo<ErrorFieldMap>(
    () => ({
      applicant: 'applicant',
      files: 'file-upload',
      fileItems: {
        file: (i) => `document-type-${filesWithTypes[i]?.id ?? i}`,
        documentType: (i) => `document-type-${filesWithTypes[i]?.id ?? i}`,
      },
    }),
    [filesWithTypes],
  );

  const errorSummary = useErrorSummary(errors as Record<string, unknown>, errorFieldMap);

  return (
    <div className="max-w-prose space-y-8">
      <errorSummary.ErrorSummary />

      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <CsrfTokenInput />

        <div className="space-y-6">
          <InputSelect id="applicant" name="applicant" label={t('documents:upload.who-are-you-uploading-for')} required className="w-full" options={applicantOptions} defaultValue="" errorMessage={errors?.applicant} />

          <fieldset>
            <InputLegend className="mb-2">{t('documents:upload.upload-document')}</InputLegend>
            <p>{t('documents:upload.max-files', { count: DOCUMENT_UPLOAD_MAX_FILE_COUNT })}</p>
            <p className="mb-2">
              {t('documents:upload.max-size', {
                filesize: bytesToFilesize(megabytesToBytes(env.DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB), `${i18n.language}-CA`),
                extensions: [...DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS].join(', '),
              })}
            </p>

            {errors?.files && (
              <InputError id="files-error" className="mb-2">
                {errors.files}
              </InputError>
            )}

            <FileUpload
              id="file-upload"
              onValueChange={handleFileChange}
              multiple={false}
              accept={[...new Set([...DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS, ...DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS.map(getMimeType)])].join(',')}
              className="gap-4 sm:gap-6"
            >
              <div>
                <FileUploadTrigger asChild>
                  <Button variant="secondary" startIcon={faArrowUpFromBracket}>
                    {t('documents:upload.add-file')}
                  </Button>
                </FileUploadTrigger>
              </div>

              <FileUploadList className="gap-4 sm:gap-6">
                {filesWithTypes.map(({ id, file, documentType }, index) => (
                  <FileUploadItem key={id} value={file} className="flex-col items-stretch gap-3 sm:gap-4">
                    <dl className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <dt className="font-semibold">{t('documents:upload.file-name')}</dt>
                        <dd>{file.name}</dd>
                      </div>
                    </dl>

                    <InputSelect
                      id={`document-type-${id}`}
                      name={`document-type-${index}`}
                      label={t('documents:upload.document-type')}
                      required
                      className="w-full"
                      options={docTypeOptions}
                      value={documentType}
                      onChange={(e) => {
                        setFilesWithTypes((prev) => prev.map((p) => (p.id === id ? { ...p, documentType: e.target.value } : p)));
                      }}
                      errorMessage={errors?.fileItems?.[index]?.documentType}
                    />

                    <div className="mt-2">
                      <FileUploadItemDelete asChild>
                        <Button variant="secondary" size="sm" endIcon={faTimes}>
                          {t('documents:upload.remove')}
                        </Button>
                      </FileUploadItemDelete>
                    </div>
                  </FileUploadItem>
                ))}
              </FileUploadList>
            </FileUpload>
          </fieldset>
        </div>

        <div className="mt-8">
          <LoadingButton id="submit-button" variant="primary" type="submit" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Submit - Upload my documents click">
            {t('documents:upload.submit')}
          </LoadingButton>
        </div>
      </fetcher.Form>

      <div>
        <ButtonLink id="back-button" variant="secondary" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Return to dashboard - Upload my documents click">
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

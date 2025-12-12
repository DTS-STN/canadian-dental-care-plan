import { useMemo, useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import { fileTypeFromBuffer } from 'file-type';
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
import { FileUpload, FileUploadItem, FileUploadItemDelete, FileUploadList, FileUploadTrigger } from '~/components/file-upload';
import type { FileState } from '~/components/file-upload';
import { ErrorMessage } from '~/components/future-error-message';
import { ErrorSummary } from '~/components/future-error-summary';
import { ErrorSummaryProvider } from '~/components/future-error-summary-context';
import { InputSelect } from '~/components/future-input-select';
import { InputLegend } from '~/components/input-legend';
import type { InputOptionProps } from '~/components/input-option';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useClientEnv } from '~/root';
import { getClientEnv } from '~/utils/env-utils';
import { arrayBufferToBase64, getFileExtension, getMimeType } from '~/utils/file.utils';
import { getLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';
import { bytesToFilesize, megabytesToBytes } from '~/utils/units.utils';

type UploadErrors = {
  applicant?: string;
  files?: string;
  fileItems?: Record<string, { file?: string; documentType?: string }>;
};

type CreateDocumentUploadSchemaArgs = {
  locale: string;
  t: TFunction<typeof handle.i18nNamespaces>;
  allowedExtensions: ReadonlyArray<string>;
  maxFileSizeInMB: number;
  maxFileCount: number;
};

type FileStateWithDocumentType = FileState & { readonly documentType: string };

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
    // TODO: Add children later when upload for children is supported
    // ...clientApplication.children.map((c) => ({ clientId: c.information.clientId, name: `${c.information.firstName} ${c.information.lastName}`.trim() })),
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

  const validationResult = await validateUploadForm(formData, locale, t, {
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
  const allowedExtensions = config.DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS;

  const validationResult = await validateUploadForm(formData, locale, t, {
    allowedExtensions,
    maxSizeMB: config.DOCUMENT_UPLOAD_MAX_FILE_SIZE_MB,
    maxCount: config.DOCUMENT_UPLOAD_MAX_FILE_COUNT,
  });

  if (!validationResult.success) {
    return { errors: validationResult.errors };
  }

  const { applicant, files } = validationResult.data;
  const uploadService = appContainer.get(TYPES.DocumentUploadService);

  const scanResult = await scanDocuments({ allowedExtensions, files, userId: idToken.sub, service: uploadService, t });
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

async function validateUploadForm(
  formData: FormData,
  locale: string,
  t: TFunction<typeof handle.i18nNamespaces>,
  config: { allowedExtensions: readonly string[]; maxSizeMB: number; maxCount: number },
): Promise<{ success: true; data: DocumentUploadSchemaOuput } | { success: false; errors: UploadErrors }> {
  const schema = createDocumentUploadSchema({ locale, t, allowedExtensions: config.allowedExtensions, maxFileSizeInMB: config.maxSizeMB, maxFileCount: config.maxCount });

  // Parse form data into expected structure
  const fileIds = formData.getAll('file_id') as string[];
  const fileObjects = formData.getAll('file_object') as File[];
  const documentTypes = formData.getAll('file_document_type') as string[];

  // Build files record
  const files: Record<string, { file: File; fileBuffer: ArrayBuffer; fileHash: string; documentType: string }> = {};

  for (const [i, fileId] of fileIds.entries()) {
    const file = fileObjects[i];
    const fileBuffer = await file.arrayBuffer();
    const fileHashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const fileHash = [...new Uint8Array(fileHashBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const documentType = documentTypes[i] ?? '';
    files[fileId] = { file, fileBuffer, fileHash, documentType };
  }

  // Build final data object
  const data = {
    applicant: formData.get('applicant'),
    files: files,
  };

  // Validate using Zod schema
  const result = schema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: mapZodErrors(result.error) };
  }

  return { success: true, data: result.data };
}

interface ScanDocumentsRequestArgs {
  allowedExtensions: ReadonlyArray<string>;
  files: DocumentUploadSchemaOuput['files'];
  userId: string;
  service: DocumentUploadService;
  t: TFunction<typeof handle.i18nNamespaces>;
}

async function scanDocuments({ allowedExtensions, files, service, t, userId }: ScanDocumentsRequestArgs): Promise<UploadDocumentsResponseArgs> {
  const allowedMimeTypes = new Set(allowedExtensions.map(getMimeType));

  const promises = Object.entries(files).map(async ([id, { file, fileBuffer }]) => {
    try {
      const invalidTypeError = t('documents:upload.error-message.invalid-file-type', {
        filename: file.name,
        extensions: allowedExtensions.join(', '),
      });

      const detected = await fileTypeFromBuffer(fileBuffer);
      const declared = file.type;

      // --- MIME VALIDATION ----------------------------------------------------

      // no detected type → only allow declared text/plain
      if (!detected && declared !== 'text/plain') {
        return { id, error: invalidTypeError };
      }

      // detected but not allowed
      if (detected && !allowedMimeTypes.has(detected.mime)) {
        return { id, error: invalidTypeError };
      }

      // --- VIRUS SCAN ---------------------------------------------------------

      const scanResponse = await service.scanDocument({
        fileName: file.name,
        binary: arrayBufferToBase64(fileBuffer),
        userId,
      });

      if (scanResponse.Error) {
        return { id, error: t('documents:upload.error-message.scan-failed', { error: scanResponse.Error.ErrorMessage }) };
      }

      return { id, success: true };
    } catch {
      return { id, error: t('documents:upload.error-message.scan-error') };
    }
  });

  const results = await Promise.all(promises);
  return processBatchResults(results);
}

interface UploadDocumentsRequestArgs {
  clientNumber: string;
  files: DocumentUploadSchemaOuput['files'];
  userId: string;
  service: DocumentUploadService;
  t: TFunction<typeof handle.i18nNamespaces>;
}

interface UploadDocumentsResponseArgs {
  success: boolean;
  errors?: UploadErrors;
}

async function uploadDocuments({ clientNumber, files, service, t, userId }: UploadDocumentsRequestArgs): Promise<UploadDocumentsResponseArgs> {
  const promises = Object.entries(files).map(async ([id, { file, fileBuffer, documentType }]) => {
    try {
      const response = await service.uploadDocument({
        clientNumber,
        evidentiaryDocumentTypeId: documentType,
        fileName: file.name,
        binary: arrayBufferToBase64(fileBuffer),
        uploadDate: new Date(),
        userId,
      });

      return response.Error //
        ? { id, error: t('documents:upload.error-message.upload-failed', { error: response.Error.ErrorMessage }) }
        : { id, success: true };
    } catch {
      return { id, error: t('documents:upload.error-message.upload-error') };
    }
  });

  const results = await Promise.all(promises);
  return processBatchResults(results);
}

function processBatchResults(results: { id: string; error?: string }[]): { success: boolean; errors?: UploadErrors } {
  const failures = results.filter((r) => r.error);
  if (failures.length === 0) return { success: true };

  const errors: UploadErrors = { fileItems: {} };
  for (const { id, error } of failures) {
    if (errors.fileItems) errors.fileItems[id] = { file: error };
  }
  return { success: false, errors };
}

interface CreateMetadataArgs {
  appContainer: AppContainerProvider;
  clientId: string;
  files: DocumentUploadSchemaOuput['files'];
  userId: string;
}

async function createMetadata({ appContainer, clientId, files, userId }: CreateMetadataArgs) {
  const reasons = await appContainer.get(TYPES.DocumentUploadReasonService).listDocumentUploadReasons();
  const reasonId = reasons[0].id;
  const recordSource = Number(appContainer.get(TYPES.ServerConfig).EWDU_RECORD_SOURCE_MSCA);
  const evidentiaryDocumentService = appContainer.get(TYPES.EvidentiaryDocumentService);
  return await evidentiaryDocumentService.createEvidentiaryDocumentMetadata({
    clientId: clientId,
    documents: Object.entries(files).map(([fileId, { file, documentType }]) => ({
      fileName: file.name,
      evidentiaryDocumentTypeId: documentType,
      documentUploadReasonId: reasonId,
      recordSource,
      uploadDate: new Date(),
    })),
    userId: userId,
  });
}

type DocumentUploadSchemaOuput = z.output<ReturnType<typeof createDocumentUploadSchema>>;

function createDocumentUploadSchema({ locale, t, allowedExtensions, maxFileSizeInMB, maxFileCount }: CreateDocumentUploadSchemaArgs) {
  const maxFileSizeInBytes = megabytesToBytes(maxFileSizeInMB);

  const fileSchema = z
    .object({
      file: z.instanceof(File),
      fileBuffer: z.instanceof(ArrayBuffer),
      fileHash: z.string(),
      documentType: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!allowedExtensions.includes(getFileExtension(data.file.name))) {
        ctx.addIssue({
          code: 'custom',
          message: t('documents:upload.error-message.invalid-file-type', {
            filename: data.file.name,
            extensions: allowedExtensions.join(', '),
          }),
          path: ['file'],
        });
      }

      if (data.file.size > maxFileSizeInBytes) {
        ctx.addIssue({
          code: 'custom',
          message: t('documents:upload.error-message.file-too-large', {
            filename: data.file.name,
            filesize: bytesToFilesize(maxFileSizeInBytes, `${locale}-CA`),
          }),
          path: ['file'],
        });
      }

      if (!data.documentType) {
        ctx.addIssue({
          code: 'custom',
          message: t('documents:upload.error-message.document-type-required', { filename: data.file.name }),
          path: ['documentType'],
        });
      }
    });

  return z.object({
    applicant: z
      .string(t('documents:upload.error-message.applicant-required')) //
      .trim()
      .nonempty(t('documents:upload.error-message.applicant-required')),
    files: z
      .record(z.string(), fileSchema) //
      .refine((value) => Object.keys(value).length > 0, t('documents:upload.error-message.file-required'))
      .refine((value) => Object.keys(value).length <= maxFileCount, t('documents:upload.error-message.too-many-files', { count: maxFileCount }))
      .superRefine((files, ctx) => {
        const seenFiles = new Set<string>();
        for (const [id, { file, fileHash }] of Object.entries(files)) {
          const fileKey = `file-${file.name}-${file.size}-${fileHash}`;
          if (seenFiles.has(fileKey)) {
            ctx.addIssue({
              code: 'custom',
              message: t('documents:upload.error-message.duplicate-file', { filename: file.name }),
              path: [id, 'file'],
            });
          } else {
            seenFiles.add(fileKey);
          }
        }
      }),
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
        const id = path[1] as string;
        const field = path[2] as 'file' | 'documentType';
        errors.fileItems ??= {};
        errors.fileItems[id] ??= {};
        errors.fileItems[id][field] = message;
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

  const [filesWithTypes, setFilesWithTypes] = useState<FileStateWithDocumentType[]>([]);

  const handleFileChange = (files: ReadonlyArray<FileState>) => {
    setFilesWithTypes((prev) => {
      const prevMap = new Map(prev.map((item) => [item.id, item]));
      const newItems: FileStateWithDocumentType[] = [];

      for (const file of files) {
        const prevFile = prevMap.get(file.id);
        if (prevFile) {
          newItems.push(prevFile);
        } else {
          newItems.push({ ...file, documentType: '' });
        }
      }
      const uniqueItems = new Map(newItems.map((item) => [item.id, item]));
      return [...uniqueItems.values()];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete('file_id');
    formData.delete('file_object');
    formData.delete('file_document_type');

    for (const { id, file, documentType } of filesWithTypes) {
      formData.append('file_id', id);
      formData.append('file_object', file);
      formData.append('file_document_type', documentType);
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

  return (
    <div className="max-w-prose space-y-8">
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
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
                  extensions: DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS.join(', '),
                })}
              </p>
              {errors?.files && <ErrorMessage id="files-error" className="mb-2" fieldId="fileUploadTrigger" message={errors.files} />}
              <FileUpload id="file-upload" label={t('documents:upload.upload-document')} value={filesWithTypes} onValueChange={handleFileChange} accept={DOCUMENT_UPLOAD_ALLOWED_FILE_EXTENSIONS.join(',')} className="gap-4 sm:gap-6">
                <div>
                  <FileUploadTrigger asChild>
                    <Button id="fileUploadTrigger" variant="secondary" className={cn(errors?.files && 'border-red-500 text-red-500 hover:bg-red-100 focus:bg-red-100')} startIcon={faArrowUpFromBracket}>
                      {t('documents:upload.add-file')}
                    </Button>
                  </FileUploadTrigger>
                </div>
                <FileUploadList className="gap-4 sm:gap-6">
                  {filesWithTypes.map(({ id, file, documentType }) => {
                    const fileError = errors?.fileItems?.[id]?.file;
                    const documentTypeError = errors?.fileItems?.[id]?.documentType;
                    return (
                      <FileUploadItem
                        id={`file-upload-item-${id}`}
                        key={id}
                        value={id}
                        className={cn('flex-col items-stretch gap-3 sm:gap-4', fileError && 'border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500 focus:outline-hidden')}
                        tabIndex={-1}
                      >
                        {fileError && <ErrorMessage id={`file-error-${id}`} fieldId={`file-upload-item-${id}`} message={fileError} />}
                        <dl className="space-y-3 sm:space-y-4">
                          <div className="space-y-2">
                            <dt className="font-semibold">{t('documents:upload.file-name')}</dt>
                            <dd>{file.name}</dd>
                          </div>
                        </dl>

                        <InputSelect
                          id={`document-type-${id}`}
                          name={`document-type-${id}`}
                          label={t('documents:upload.document-type')}
                          required
                          className="w-full"
                          options={docTypeOptions}
                          value={documentType}
                          onChange={(e) => {
                            setFilesWithTypes((prev) => prev.map((p) => (p.id === id ? { ...p, documentType: e.target.value } : p)));
                          }}
                          errorMessage={documentTypeError}
                        />

                        <div className="mt-2">
                          <FileUploadItemDelete asChild>
                            <Button variant="secondary" size="sm" endIcon={faTimes}>
                              {t('documents:upload.remove')}
                            </Button>
                          </FileUploadItemDelete>
                        </div>
                      </FileUploadItem>
                    );
                  })}
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
      </ErrorSummaryProvider>

      <div>
        <ButtonLink id="back-button" variant="secondary" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Return to dashboard - Upload my documents click">
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

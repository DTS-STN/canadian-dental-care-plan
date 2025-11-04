import { useMemo, useState } from 'react';

import { useFetcher } from 'react-router';

import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { TFunction } from 'i18next';
import { getI18n, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/upload';

import { TYPES } from '~/.server/constants';
import type { DocumentScanRequestDto } from '~/.server/domain/dtos';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import type { ErrorFieldMap } from '~/components/error-summary';
import { useErrorSummary } from '~/components/error-summary';
import { FileUpload, FileUploadItem, FileUploadItemDelete, FileUploadList, FileUploadTrigger } from '~/components/file-upload';
import { InputLegend } from '~/components/input-legend';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { randomHexString } from '~/utils/string-utils';

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
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const locale = getLocale(request);

  await securityHandler.requireClientNumber({ params, request, session });
  const applicantNames = [`${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`, ...clientApplication.children.map((c) => `${c.information.firstName} ${c.information.lastName}`)].map((name) =>
    name.trim(),
  );

  const evidentiaryDocumentTypeService = appContainer.get(TYPES.EvidentiaryDocumentTypeService);
  const localizedEvidentiaryDocumentTypes = await evidentiaryDocumentTypeService.listLocalizedEvidentiaryDocumentTypes(locale);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('documents:upload.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.documents-upload', { userId: idToken.sub });

  return {
    meta,
    applicantNames,
    documentTypes: localizedEvidentiaryDocumentTypes,
    SCCH_BASE_URI,
  };
}

function createDocumentUploadSchema(t: TFunction<typeof handle.i18nNamespaces>) {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const ALLOWED_EXTENSIONS = new Set(['.docx', '.ppt', '.txt', '.pdf', '.jpg', '.jpeg', '.png']);
  const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-powerpoint', // .ppt
    'text/plain', // .txt
    'application/pdf', // .pdf
    'image/jpeg', // .jpg, .jpeg
    'image/png', // .png
  ]);

  const fileWithDocumentTypeSchema = z.object({
    file: z
      .instanceof(File, { message: t('documents:upload.error-message.file-required') })
      .refine((file) => file.size <= MAX_FILE_SIZE, t('documents:upload.error-message.file-too-large'))
      .refine((file) => {
        const fileExtension = file.name.includes('.') ? '.' + file.name.split('.').at(-1)?.toLowerCase() : '';
        return ALLOWED_EXTENSIONS.has(fileExtension);
      }, t('documents:upload.error-message.invalid-file-type'))
      .refine((file) => {
        return ALLOWED_MIME_TYPES.has(file.type);
      }, t('documents:upload.error-message.invalid-file-type')),
    documentType: z.string().min(1, t('documents:upload.error-message.document-type-required')),
  });

  return z.object({
    applicant: z.string().min(1, t('documents:upload.error-message.applicant-required')),
    files: z.array(fileWithDocumentTypeSchema).min(1, t('documents:upload.error-message.file-required')).max(10, t('documents:upload.error-message.too-many-files')),
  });
}

type UploadErrors = {
  applicant?: string;
  files?: string;
  fileItems?: {
    [key: number]: {
      file?: string;
      documentType?: string;
    };
  };
};

export async function clientAction({ request, serverAction }: Route.ClientActionArgs) {
  const formData = await request.clone().formData();

  const locale = getLanguage(request);
  const t = getI18n().getFixedT(locale, handle.i18nNamespaces);

  const applicant = formData.get('applicant') as string;
  const files = formData.getAll('files') as File[];
  const documentTypes = formData.getAll('documentTypes') as string[];

  const filesWithTypes = files.map((file, index) => ({
    file: file,
    documentType: documentTypes[index] ?? '',
  }));

  const formDataObj = {
    applicant: applicant,
    files: filesWithTypes,
  };

  const parsedDataResult = createDocumentUploadSchema(t).safeParse(formDataObj);

  if (!parsedDataResult.success) {
    const errors: UploadErrors = {};
    for (const { message, path } of parsedDataResult.error.issues) {
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
    return { errors };
  }

  return await serverAction();
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const locale = getLocale(request);
  const t = await getFixedT(locale, handle.i18nNamespaces);

  const applicant = formData.get('applicant') as string;
  const files = formData.getAll('files') as File[];
  const documentTypes = formData.getAll('documentTypes') as string[];

  const filesWithTypes = files.map((file, index) => ({
    file: file,
    documentType: documentTypes[index] ?? '',
  }));

  const formDataObj = {
    applicant: applicant,
    files: filesWithTypes,
  };

  const parsedDataResult = createDocumentUploadSchema(t).safeParse(formDataObj);

  if (!parsedDataResult.success) {
    const errors: UploadErrors = {};
    for (const { message, path } of parsedDataResult.error.issues) {
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
    return { errors };
  }

  const documentUploadService = appContainer.get(TYPES.DocumentUploadService);
  const idToken: IdToken = session.get('idToken');

  const scanPromises = files.map(async (file, index) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const binary = Buffer.from(arrayBuffer).toString('base64');

      const scanRequest: DocumentScanRequestDto = {
        fileName: file.name,
        binary: binary,
        userId: idToken.sub,
      };

      const scanResponse = await documentUploadService.scanDocument(scanRequest);

      if (scanResponse.Error) {
        return {
          index,
          fileName: file.name,
          success: false,
          error: t('documents:upload.error-message.scan-failed', {
            error: scanResponse.Error.ErrorMessage,
            code: scanResponse.Error.ErrorCode,
          }),
        };
      }

      if (scanResponse.Percent !== '100') {
        return {
          index,
          fileName: file.name,
          success: false,
          error: t('documents:upload.error-message.scan-incomplete'),
        };
      }

      return {
        index,
        fileName: file.name,
        success: true,
        error: undefined,
      };
    } catch {
      return {
        index,
        fileName: file.name,
        success: false,
        error: t('documents:upload.error-message.scan-error'),
      };
    }
  });

  const scanResults = await Promise.all(scanPromises);
  const failedScans = scanResults.filter((result) => !result.success);

  if (failedScans.length > 0) {
    const scanErrors: UploadErrors = {};
    for (const { index, error } of failedScans) {
      if (error) {
        scanErrors.fileItems ??= {};
        scanErrors.fileItems[index] = {
          file: error,
        };
      }
    }

    return { errors: scanErrors };
  }

  // All scans passed - return success
  return { success: true };
}

export default function DocumentsUpload({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applicantNames, documentTypes, SCCH_BASE_URI } = loaderData;

  type ActionData = { errors: UploadErrors } | Awaited<ReturnType<typeof action>>;
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== 'idle';

  const [filesWithTypes, setFilesWithTypes] = useState<FileWithType[]>([]);
  const errors = fetcher.data?.errors;

  const errorFieldMap = useMemo<ErrorFieldMap>(
    () => ({
      applicant: 'applicant',
      files: 'file-upload',
      fileItems: {
        file: (index: number) => {
          const id = filesWithTypes[index]?.id;
          return id ? `document-type-${id}` : `document-type-${index}`;
        },
        documentType: (index: number) => {
          const id = filesWithTypes[index]?.id;
          return id ? `document-type-${id}` : `document-type-${index}`;
        },
      },
    }),
    [filesWithTypes],
  );

  const errorSummary = useErrorSummary(errors as Record<string, unknown>, errorFieldMap);

  const applicantOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...applicantNames.map((name) => ({ children: name, value: name }))];
  }, [applicantNames, t]);

  const documentTypeOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...documentTypes.map(({ id, name }) => ({ children: name, value: id }))];
  }, [documentTypes, t]);

  interface FileWithType {
    id: string;
    file: File;
    documentType: string;
  }

  const handleFileChange = (newFiles: File[]) => {
    const uniqueFilesMap = new Map<string, File>();
    for (const file of newFiles) {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      if (!uniqueFilesMap.has(fileKey)) {
        uniqueFilesMap.set(fileKey, file);
      }
    }
    const uniqueNewFiles = [...uniqueFilesMap.values()];

    setFilesWithTypes((prev) => {
      const matchedPrevIds = new Set<string>();

      const newFilesWithTypes = uniqueNewFiles.map((newFile) => {
        const existingEntry = prev.find((oldEntry) => !matchedPrevIds.has(oldEntry.id) && oldEntry.file.name === newFile.name && oldEntry.file.lastModified === newFile.lastModified && oldEntry.file.size === newFile.size);

        if (existingEntry) {
          matchedPrevIds.add(existingEntry.id);
          return {
            id: existingEntry.id,
            file: newFile,
            documentType: existingEntry.documentType,
          };
        }

        return {
          id: randomHexString(8),
          file: newFile,
          documentType: '',
        };
      });

      return newFilesWithTypes;
    });
  };

  const handleDocumentTypeChange = (id: string, value: string) => {
    setFilesWithTypes((prev) => {
      return prev.map((item) => (item.id === id ? { ...item, documentType: value } : item));
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();

    formData.append('_csrf', (event.currentTarget.elements.namedItem('_csrf') as HTMLSelectElement).value);
    formData.append('applicant', (event.currentTarget.elements.namedItem('applicant') as HTMLSelectElement).value);

    for (const { file, documentType } of filesWithTypes) {
      formData.append('files', file);
      formData.append('documentTypes', documentType);
    }

    await fetcher.submit(formData, {
      method: 'post',
      encType: 'multipart/form-data',
    });
  };

  return (
    <div className="max-w-prose space-y-8">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <CsrfTokenInput />
        <div className="space-y-6">
          <InputSelect id="applicant" name="applicant" label="Who are you uploading for" required className="w-full" options={applicantOptions} defaultValue="" errorMessage={errors?.applicant} />
          <fieldset>
            <InputLegend className="mb-2">Upload document</InputLegend>
            <p>You can upload up to 10 files at once.</p>
            <p className="mb-2">Maximum file size is 10MB. File types accepted: .docx, .ppt, .txt, .pdf, .jpg, .jpeg, .png</p>

            {errors?.files && <p className="mb-2 text-sm text-red-700">{errors.files}</p>}

            <FileUpload
              id="file-upload"
              onValueChange={handleFileChange}
              multiple={false}
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
              accept=".docx,.ppt,.txt,.pdf,.jpg,.jpeg,.png"
              className="gap-4 sm:gap-6"
              onFileReject={(file, message) => {
                console.warn(`File rejected: ${file.name}, reason: ${message}`);
              }}
            >
              <div>
                <FileUploadTrigger asChild>
                  <Button startIcon={faArrowUpFromBracket}>Add file</Button>
                </FileUploadTrigger>
              </div>
              <FileUploadList className="gap-4 sm:gap-6">
                {filesWithTypes.map(({ id, file, documentType }, index) => (
                  <FileUploadItem key={id} value={file} className="flex-col items-stretch gap-3 sm:gap-4">
                    <input type="hidden" name={`file-${index}`} value={file.name} />
                    <dl className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <dt className="font-semibold">File name</dt>
                        <dd>{file.name}</dd>
                      </div>
                    </dl>

                    {errors?.fileItems?.[index]?.file && <p className="mb-2 text-sm text-red-700">{errors.fileItems[index].file}</p>}

                    <InputSelect
                      id={`document-type-${id}`}
                      name={`document-type-${index}`}
                      label="Document Type"
                      required
                      className="w-full"
                      options={documentTypeOptions}
                      value={documentType}
                      onChange={(e) => {
                        e.preventDefault();
                        handleDocumentTypeChange(id, e.target.value);
                      }}
                      errorMessage={errors?.fileItems?.[index]?.documentType}
                    />
                    <div className="mt-2">
                      <FileUploadItemDelete asChild>
                        <Button size="sm" endIcon={faTimes}>
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
        <div className="mt-8">
          <LoadingButton id="submit-button" variant="primary" type="submit" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Submit - Upload my documents click">
            {t('documents:upload.submit')}
          </LoadingButton>
        </div>
      </fetcher.Form>

      <div>
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Documents-Protected:Return to dashboard - Upload my documents click">
          {t('documents:index.return-dashboard')}
        </ButtonLink>
      </div>
    </div>
  );
}

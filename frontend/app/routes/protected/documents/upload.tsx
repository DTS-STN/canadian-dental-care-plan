import { useMemo, useState } from 'react';

import { useFetcher } from 'react-router';

import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/upload';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import type { ErrorFieldMap } from '~/components/error-summary';
import { useErrorSummary } from '~/components/error-summary';
import { FileUpload, FileUploadItem, FileUploadItemDelete, FileUploadList, FileUploadTrigger } from '~/components/file-upload';
import { InputLegend } from '~/components/input-legend';
import type { InputOptionProps } from '~/components/input-option';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces, initI18n } from '~/utils/locale-utils';
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

function createDocumentUploadSchema(t: TFunction) {
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

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const i18n = await initI18n(['documents']);

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

  const parsedDataResult = createDocumentUploadSchema(i18n.t).safeParse(formDataObj);

  if (!parsedDataResult.success) {
    interface UploadErrors {
      applicant?: string;
      files?: string;
      fileItems?: {
        [key: number]: {
          file?: string;
          documentType?: string;
        };
      };
    }

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

  // If validation passes, you can proceed with the upload
  // For now, we'll just return success
  return { success: true };
}

export default function DocumentsUpload({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applicantNames, documentTypes, SCCH_BASE_URI } = loaderData;

  const fetcher = useFetcher<typeof clientAction>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;

  const errorFieldMap = useMemo<ErrorFieldMap>(
    () => ({
      applicant: 'applicant',
      files: 'file-upload',
      fileItems: {
        file: (index: number) => `document-type-${index}`,
        documentType: (index: number) => `document-type-${index}`,
      },
    }),
    [],
  );

  const errorSummary = useErrorSummary(errors, errorFieldMap);

  const applicantOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...applicantNames.map((name) => ({ children: name, value: name }))];
  }, [applicantNames, t]);

  const documentTypeOptions = useMemo<InputOptionProps[]>(() => {
    const dummyOption: InputOptionProps = { children: t('documents:upload.select-one'), value: '', disabled: true, hidden: true };
    return [dummyOption, ...documentTypes.map(({ id, name }) => ({ children: name, value: id }))];
  }, [documentTypes, t]);

  interface FileWithType {
    file: File;
    documentType: string;
  }

  const [filesWithTypes, setFilesWithTypes] = useState<FileWithType[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFilesWithTypes((prev) => {
      const newFilesWithTypes = newFiles.map((newFile) => {
        const existingEntry = prev.find((oldEntry) => oldEntry.file.name === newFile.name && oldEntry.file.lastModified === newFile.lastModified && oldEntry.file.size === newFile.size);
        return {
          file: newFile,
          documentType: existingEntry ? existingEntry.documentType : '',
        };
      });
      return newFilesWithTypes;
    });
  };

  const handleDocumentTypeChange = (index: number, value: string) => {
    setFilesWithTypes((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], documentType: value };
      return newFiles;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();

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
                {filesWithTypes.map(({ file, documentType }, index) => (
                  <FileUploadItem key={`${file.name}_${file.lastModified}_${file.size}`} value={file} className="flex-col items-stretch gap-3 sm:gap-4">
                    <input type="hidden" name={`file-${index}`} value={file.name} />
                    <dl className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <dt className="font-semibold">File name</dt>
                        <dd>{file.name}</dd>
                      </div>
                    </dl>

                    {errors?.fileItems?.[index]?.file && <p className="mb-2 text-sm text-red-700">{errors.fileItems[index].file}</p>}

                    <InputSelect
                      id={`document-type-${index}`}
                      name={`document-type-${index}`}
                      label="Document Type"
                      required
                      className="w-full"
                      options={documentTypeOptions}
                      value={documentType}
                      onChange={(e) => {
                        e.preventDefault();
                        handleDocumentTypeChange(index, e.target.value);
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

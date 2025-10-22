import { useMemo, useState } from 'react';

import { useFetcher } from 'react-router';

import { faArrowUpFromBracket, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/upload';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
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

  await securityHandler.requireClientNumber({ params, request, session });
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

// Client action validation schema
// TODO beef up validation => MIME type, extension, etc
const clientUploadSchema = z
  .object({
    applicant: z.string().min(1, 'documents:upload.error-message.applicant-required'),
    reason: z.string().min(1, 'documents:upload.error-message.reason-required'),
    files: z.array(z.instanceof(File, { message: 'documents:upload.error-message.file-required' })).min(1, 'documents:upload.error-message.files-required'),
    documentTypes: z.array(z.string().min(1, 'documents:upload.error-message.document-type-required')),
  })
  .superRefine((data, ctx) => {
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

    for (let index = 0, file = data.files[index]; index < data.files.length; index++) {
      if (file.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          code: 'custom',
          message: 'documents:upload.error-message.file-too-large',
          path: ['files', index],
        });
      }

      const fileExtension = file.name.includes('.') ? '.' + file.name.split('.').at(-1)?.toLowerCase() : '';
      if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
        ctx.addIssue({
          code: 'custom',
          message: 'documents:upload.error-message.invalid-file-type',
          path: ['files', index],
        });
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        ctx.addIssue({
          code: 'custom',
          message: 'documents:upload.error-message.invalid-file-type',
          path: ['files', index],
        });
      }
    }

    if (data.files.length > 10) {
      ctx.addIssue({
        code: 'custom',
        message: 'documents:upload.error-message.too-many-files',
        path: ['files'],
      });
    }

    for (let index = 0, documentType = data.documentTypes[index]; index < data.documentTypes.length; index++) {
      if (!documentType || documentType.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'documents:upload.error-message.document-type-required',
          path: ['documentTypes', index],
        });
      }
    }
  });

export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();

  const files = formData.getAll('files');
  const documentTypes = formData.getAll('documentTypes');

  const formDataObj = {
    applicant: formData.get('applicant'),
    reason: formData.get('reason'),
    files: [...files],
    documentTypes: [...documentTypes],
  };

  const parsedDataResult = clientUploadSchema.safeParse(formDataObj);

  if (!parsedDataResult.success) {
    interface UploadErrors {
      applicant?: string;
      reason?: string;
      files?: string;
      documentTypes?: {
        [key: number]: string;
      };
    }
    const errors: UploadErrors = {};
    for (const { message, path } of parsedDataResult.error.issues) {
      if (path[0] === 'documentTypes') {
        errors.documentTypes ??= {};
        errors.documentTypes[path[1] as number] = message;
      } else {
        errors[path[0] as keyof UploadErrors] = message;
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
  const { applicantNames, documentTypes, reasons, SCCH_BASE_URI } = loaderData;

  const fetcher = useFetcher<typeof clientAction>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;

  // Memoize the errorFieldMap to prevent it from being a new object on every render.
  // This stops the useEffect in useErrorSummary from re-running on state changes.
  const errorFieldMap = useMemo(
    () => ({
      applicant: 'applicant',
      reason: 'reason',
      files: 'file-upload',
      documentTypes: (index: number) => `document-type-${index}`, // Function to generate field IDs for array items
    }),
    [],
  );

  const errorSummary = useErrorSummary(errors, errorFieldMap);

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

  interface FileWithType {
    file: File;
    documentType: string;
  }

  const [filesWithTypes, setFilesWithTypes] = useState<FileWithType[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFilesWithTypes((prev) => {
      // Create a new array by mapping over the new list of files
      const newFilesWithTypes = newFiles.map((newFile) => {
        // Find the old file entry, if it exists, to preserve the documentType
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
    formData.append('reason', (event.currentTarget.elements.namedItem('reason') as HTMLSelectElement).value);

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
          <InputSelect id="reason" name="reason" label="Reason for file upload" required className="w-full" options={reasonOptions} defaultValue="" errorMessage={errors?.reason} />
          <fieldset>
            <InputLegend className="mb-2">Upload document</InputLegend>
            <p>You can upload up to 10 files at once.</p>
            <p className="mb-2">Maximum file size is 10MB. File types accepted: .docx, .ppt, .txt, .pdf, .jpg, .jpeg, .png</p>

            {errors?.files && <p className="mb-2 text-sm text-red-700">Select a file</p>}

            <FileUpload
              id="file-upload"
              onValueChange={handleFileChange}
              multiple={false}
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
              accept=".docx,.ppt,.txt,.pdf,.jpg,.jpeg,.png"
              className="gap-4 sm:gap-6"
              onFileReject={(file, message) => {
                // Handle file rejection (too large, wrong type, etc.)
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
                      errorMessage={errors?.documentTypes?.[index]}
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

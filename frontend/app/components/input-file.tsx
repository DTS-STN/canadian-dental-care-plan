import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { Button } from './buttons';
import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

export interface InputFileProps extends OmitStrict<React.ComponentProps<'input'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'type' | 'value' | 'onChange'> {
  accept?: string;
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  id: string;
  label: string;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  value?: File[];
}

export function InputFile(props: InputFileProps) {
  const { accept, className, errorMessage, helpMessage, id, label, maxFiles = 10, maxFileSize, multiple = false, onFilesChange, required, value, ...restInputProps } = props;

  const [isDragging, setIsDragging] = useState(false);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Use controlled files if provided, otherwise use internal state
  const files = value ?? internalFiles;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  const ariaDescribedbyIds = [!!helpMessage && inputHelpMessageId].filter(Boolean).join(' ') || undefined;

  const isFileDuplicate = (file: File, existingFiles: File[]) => {
    return existingFiles.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size && existingFile.lastModified === file.lastModified);
  };

  const handleFiles = useCallback(
    (newFiles: FileList) => {
      const fileArray = [...newFiles];

      // Apply maxFiles limit
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) return;
      let filesToAdd = fileArray.slice(0, remainingSlots);

      // Filter out duplicates
      filesToAdd = filesToAdd.filter((file) => !isFileDuplicate(file, files));

      // Check file sizes if maxFileSize is specified
      if (maxFileSize) {
        const oversizedFiles = filesToAdd.filter((file) => file.size > maxFileSize);
        if (oversizedFiles.length > 0) {
          console.error(`Some files exceed the maximum size of ${maxFileSize} bytes`);
          filesToAdd = filesToAdd.filter((file) => file.size <= maxFileSize);
        }
      }

      if (filesToAdd.length === 0) return;

      const updatedFiles = multiple ? [...files, ...filesToAdd] : filesToAdd.slice(0, 1);

      setInternalFiles(updatedFiles);
      if (onFilesChange) onFilesChange(updatedFiles);
    },
    [files, maxFiles, maxFileSize, multiple, onFilesChange],
  );

  // Drag-and-drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setInternalFiles(newFiles);
    if (onFilesChange) onFilesChange(newFiles);
  };

  const clearAllFiles = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setInternalFiles([]);
    if (onFilesChange) onFilesChange([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => fileInputRef.current?.click();

  const openFile = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank');
    // Don't revoke the URL immediately as we're opening it in a new tab
    setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
  };

  // Keyboard event handler for the drop zone
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Keyboard event handler for file items
  const handleFileKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number, file: File) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFile(file);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeFile(index);
    }
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt={file.name} className="h-16 w-16 rounded-md object-cover" />;
    }
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100">
        <span className="text-xs text-gray-500">{file.name.split('.').pop()?.toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div id={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      {errorMessage && (
        <InputError id={inputErrorId} className="mb-2">
          {errorMessage}
        </InputError>
      )}

      <div
        ref={dropZoneRef}
        className={cn(
          'relative block w-full rounded-lg border-2 border-dashed p-4',
          'focus:ring-3 focus:ring-blue-500 focus:outline-hidden',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-labelledby={inputLabelId}
        aria-describedby={ariaDescribedbyIds}
      >
        {files.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group flex items-center rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFile(file);
                  }}
                  onKeyDown={(e) => handleFileKeyDown(e, index, file)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View file ${file.name}`}
                >
                  <div className="flex-shrink-0">{getFilePreview(file)}</div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    endIcon={faXmark}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="ml-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-500"
                    aria-label={`Remove file ${file.name}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={clearAllFiles}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    clearAllFiles(e);
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                tabIndex={0}
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                tabIndex={0}
              >
                Add more files
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <svg className={cn('mx-auto h-12 w-12', isDragging ? 'text-blue-500' : 'text-gray-400', errorMessage && 'text-red-500')} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <div className="flex text-sm text-gray-600">
                <span className="relative cursor-pointer rounded-md font-medium focus-within:outline-none">Click to upload</span>
                <span className="pl-1">or drag and drop</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {accept ? `Supported formats: ${accept}` : 'Any file type'}
                {maxFileSize && ` • Max size: ${(maxFileSize / 1024 / 1024).toFixed(1)} MB`}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        name={id}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        aria-describedby={ariaDescribedbyIds}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        {...restInputProps}
      />

      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
}

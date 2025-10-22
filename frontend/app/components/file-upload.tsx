import * as React from 'react';

import { faFile, faFileArchive, faFileAudio, faFileCode, faFileImage, faFileText, faFileVideo, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '~/utils/tw-utils';

const ROOT_NAME = 'FileUpload';
const DROPZONE_NAME = 'FileUploadDropzone';
const TRIGGER_NAME = 'FileUploadTrigger';
const LIST_NAME = 'FileUploadList';
const ITEM_NAME = 'FileUploadItem';
const ITEM_PREVIEW_NAME = 'FileUploadItemPreview';
const ITEM_METADATA_NAME = 'FileUploadItemMetadata';
const ITEM_DELETE_NAME = 'FileUploadItemDelete';
const CLEAR_NAME = 'FileUploadClear';

function useLazyRef<T>(fn: () => T) {
  const ref = React.useRef<T | null>(null);
  ref.current ??= fn();
  return ref as React.RefObject<T>;
}

type Direction = 'ltr' | 'rtl';

const DirectionContext = React.createContext<Direction | undefined>(undefined);

function useDirection(dirProp?: Direction): Direction {
  const contextDir = React.useContext(DirectionContext);
  return dirProp ?? contextDir ?? 'ltr';
}

interface FileState {
  file: File;
  progress: number;
  error?: string;
  status: 'idle' | 'uploading' | 'error' | 'success';
}

interface StoreState {
  files: Map<File, FileState>;
  dragOver: boolean;
  invalid: boolean;
}

type StoreAction =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'SET_FILES'; files: File[] }
  | { type: 'SET_PROGRESS'; file: File; progress: number }
  | { type: 'SET_SUCCESS'; file: File }
  | { type: 'SET_ERROR'; file: File; error: string }
  | { type: 'REMOVE_FILE'; file: File }
  | { type: 'SET_DRAG_OVER'; dragOver: boolean }
  | { type: 'SET_INVALID'; invalid: boolean }
  | { type: 'CLEAR' };

function createStore(listeners: Set<() => void>, files: Map<File, FileState>, urlCache: WeakMap<File, string>, invalid: boolean, onValueChange?: (files: File[]) => void) {
  let state: StoreState = {
    files,
    dragOver: false,
    invalid: invalid,
  };

  function reducer(state: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
      case 'ADD_FILES': {
        for (const file of action.files) {
          files.set(file, {
            file,
            progress: 0,
            status: 'idle',
          });
        }

        if (onValueChange) {
          const fileList = [...files.values()].map((fileState) => fileState.file);
          onValueChange(fileList);
        }
        return { ...state, files };
      }

      case 'SET_FILES': {
        const newFileSet = new Set(action.files);
        for (const existingFile of files.keys()) {
          if (!newFileSet.has(existingFile)) {
            files.delete(existingFile);
          }
        }

        for (const file of action.files) {
          const existingState = files.get(file);
          if (!existingState) {
            files.set(file, {
              file,
              progress: 0,
              status: 'idle',
            });
          }
        }
        return { ...state, files };
      }

      case 'SET_PROGRESS': {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            progress: action.progress,
            status: 'uploading',
          });
        }
        return { ...state, files };
      }

      case 'SET_SUCCESS': {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            progress: 100,
            status: 'success',
          });
        }
        return { ...state, files };
      }

      case 'SET_ERROR': {
        const fileState = files.get(action.file);
        if (fileState) {
          files.set(action.file, {
            ...fileState,
            error: action.error,
            status: 'error',
          });
        }
        return { ...state, files };
      }

      case 'REMOVE_FILE': {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (urlCache) {
          const cachedUrl = urlCache.get(action.file);
          if (cachedUrl) {
            URL.revokeObjectURL(cachedUrl);
            urlCache.delete(action.file);
          }
        }

        files.delete(action.file);

        if (onValueChange) {
          const fileList = [...files.values()].map((fileState) => fileState.file);
          onValueChange(fileList);
        }
        return { ...state, files };
      }

      case 'SET_DRAG_OVER': {
        return { ...state, dragOver: action.dragOver };
      }

      case 'SET_INVALID': {
        return { ...state, invalid: action.invalid };
      }

      case 'CLEAR': {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (urlCache) {
          for (const file of files.keys()) {
            const cachedUrl = urlCache.get(file);
            if (cachedUrl) {
              URL.revokeObjectURL(cachedUrl);
              urlCache.delete(file);
            }
          }
        }

        files.clear();
        if (onValueChange) {
          onValueChange([]);
        }
        return { ...state, files, invalid: false };
      }

      default: {
        return state;
      }
    }
  }

  function getState() {
    return state;
  }

  function dispatch(action: StoreAction) {
    state = reducer(state, action);
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, dispatch, subscribe };
}

const StoreContext = React.createContext<ReturnType<typeof createStore> | null>(null);

function useStoreContext(consumerName: string) {
  const context = React.useContext(StoreContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

function useStore<T>(selector: (state: StoreState) => T): T {
  const store = useStoreContext('useStore');

  const lastValueRef = useLazyRef<{ value: T; state: StoreState } | null>(() => null);

  const getSnapshot = React.useCallback(() => {
    const state = store.getState();
    const prevValue = lastValueRef.current;

    if (prevValue?.state === state) {
      return prevValue.value;
    }

    const nextValue = selector(state);
    lastValueRef.current = { value: nextValue, state };
    return nextValue;
  }, [store, selector, lastValueRef]);

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

interface FileUploadContextValue {
  inputId: string;
  dropzoneId: string;
  listId: string;
  labelId: string;
  disabled: boolean;
  dir: Direction;
  inputRef: React.RefObject<HTMLInputElement | null>;
  urlCache: WeakMap<File, string>;
}

const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

function useFileUploadContext(consumerName: string) {
  const context = React.useContext(FileUploadContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

interface FileUploadRootProps extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  onAccept?: (files: File[]) => void;
  onFileAccept?: (file: File) => void;
  onFileReject?: (file: File, message: string) => void;
  onFileValidate?: (file: File) => string | null | undefined;
  onUpload?: (
    files: File[],
    options: {
      onProgress: (file: File, progress: number) => void;
      onSuccess: (file: File) => void;
      onError: (file: File, error: Error) => void;
    },
  ) => Promise<void> | void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  dir?: Direction;
  label?: string;
  name?: string;
  asChild?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  multiple?: boolean;
  required?: boolean;
}

function FileUploadRoot(props: FileUploadRootProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    onAccept,
    onFileAccept,
    onFileReject,
    onFileValidate,
    onUpload,
    accept,
    maxFiles,
    maxSize,
    dir: dirProp,
    label,
    name,
    asChild,
    disabled = false,
    invalid = false,
    multiple = false,
    required = false,
    children,
    className,
    ...rootProps
  } = props;

  const inputId = React.useId();
  const dropzoneId = React.useId();
  const listId = React.useId();
  const labelId = React.useId();

  const dir = useDirection(dirProp);
  const listeners = useLazyRef(() => new Set<() => void>()).current;
  const files = useLazyRef<Map<File, FileState>>(() => new Map()).current;
  const urlCache = useLazyRef(() => new WeakMap<File, string>()).current;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;

  const store = React.useMemo(() => createStore(listeners, files, urlCache, invalid, onValueChange), [listeners, files, invalid, onValueChange, urlCache]);

  const acceptTypes = React.useMemo(() => accept?.split(',').map((t) => t.trim()) ?? null, [accept]);

  const onProgress = useLazyRef(() => {
    let frame = 0;
    return (file: File, progress: number) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        store.dispatch({
          type: 'SET_PROGRESS',
          file,
          progress: Math.min(Math.max(0, progress), 100),
        });
      });
    };
  }).current;

  React.useEffect(() => {
    if (isControlled) {
      store.dispatch({ type: 'SET_FILES', files: value });
    } else if (defaultValue && defaultValue.length > 0 && store.getState().files.size === 0) {
      store.dispatch({ type: 'SET_FILES', files: defaultValue });
    }
  }, [value, defaultValue, isControlled, store]);

  React.useEffect(() => {
    return () => {
      for (const file of files.keys()) {
        const cachedUrl = urlCache.get(file);
        if (cachedUrl) {
          URL.revokeObjectURL(cachedUrl);
        }
      }
    };
  }, [files, urlCache]);

  const onFilesUpload = React.useCallback(
    async (files: File[]) => {
      try {
        for (const file of files) {
          store.dispatch({ type: 'SET_PROGRESS', file, progress: 0 });
        }

        if (onUpload) {
          await onUpload(files, {
            onProgress,
            onSuccess: (file) => {
              store.dispatch({ type: 'SET_SUCCESS', file });
            },
            onError: (file, error) => {
              store.dispatch({
                type: 'SET_ERROR',
                file,
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                error: error.message ?? 'Upload failed',
              });
            },
          });
        } else {
          for (const file of files) {
            store.dispatch({ type: 'SET_SUCCESS', file });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        for (const file of files) {
          store.dispatch({
            type: 'SET_ERROR',
            file,
            error: errorMessage,
          });
        }
      }
    },
    [store, onUpload, onProgress],
  );

  const onFilesChange = React.useCallback(
    (originalFiles: File[]) => {
      if (disabled) return;

      let filesToProcess = [...originalFiles];
      let invalid = false;

      if (maxFiles) {
        const currentCount = store.getState().files.size;
        const remainingSlotCount = Math.max(0, maxFiles - currentCount);

        if (remainingSlotCount < filesToProcess.length) {
          const rejectedFiles = filesToProcess.slice(remainingSlotCount);
          invalid = true;

          filesToProcess = filesToProcess.slice(0, remainingSlotCount);

          for (const file of rejectedFiles) {
            let rejectionMessage = `Maximum ${maxFiles} files allowed`;

            if (onFileValidate) {
              const validationMessage = onFileValidate(file);
              if (validationMessage) {
                rejectionMessage = validationMessage;
              }
            }

            onFileReject?.(file, rejectionMessage);
          }
        }
      }

      const acceptedFiles: File[] = [];
      const rejectedFiles: { file: File; message: string }[] = [];

      for (const file of filesToProcess) {
        let rejected = false;
        let rejectionMessage = '';

        if (onFileValidate) {
          const validationMessage = onFileValidate(file);
          if (validationMessage) {
            rejectionMessage = validationMessage;
            onFileReject?.(file, rejectionMessage);
            rejected = true;
            invalid = true;
            continue;
          }
        }

        if (acceptTypes) {
          const fileType = file.type;
          const fileExtension = `.${file.name.split('.').pop()}`;

          if (!acceptTypes.some((type) => type === fileType || type === fileExtension || (type.includes('/*') && fileType.startsWith(type.replace('/*', '/'))))) {
            rejectionMessage = 'File type not accepted';
            onFileReject?.(file, rejectionMessage);
            rejected = true;
            invalid = true;
          }
        }

        if (maxSize && file.size > maxSize) {
          rejectionMessage = 'File too large';
          onFileReject?.(file, rejectionMessage);
          rejected = true;
          invalid = true;
        }

        if (rejected) {
          rejectedFiles.push({ file, message: rejectionMessage });
        } else {
          acceptedFiles.push(file);
        }
      }

      if (invalid) {
        store.dispatch({ type: 'SET_INVALID', invalid });
        setTimeout(() => {
          store.dispatch({ type: 'SET_INVALID', invalid: false });
        }, 2000);
      }

      if (acceptedFiles.length > 0) {
        store.dispatch({ type: 'ADD_FILES', files: acceptedFiles });

        if (isControlled && onValueChange) {
          const currentFiles = [...store.getState().files.values()].map((f) => f.file);
          onValueChange([...currentFiles]);
        }

        if (onAccept) {
          onAccept(acceptedFiles);
        }

        for (const file of acceptedFiles) {
          onFileAccept?.(file);
        }

        if (onUpload) {
          requestAnimationFrame(() => {
            void onFilesUpload(acceptedFiles);
          });
        }
      }
    },
    [store, isControlled, onValueChange, onAccept, onFileAccept, onUpload, onFilesUpload, maxFiles, onFileValidate, onFileReject, acceptTypes, maxSize, disabled],
  );

  const onInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = [...(event.target.files ?? [])];
      onFilesChange(files);
      event.target.value = '';
    },
    [onFilesChange],
  );

  const contextValue = React.useMemo<FileUploadContextValue>(
    () => ({
      dropzoneId,
      inputId,
      listId,
      labelId,
      dir,
      disabled,
      inputRef,
      urlCache,
    }),
    [dropzoneId, inputId, listId, labelId, dir, disabled, urlCache],
  );

  const RootPrimitive = asChild ? Slot : 'div';

  return (
    <StoreContext.Provider value={store}>
      <FileUploadContext.Provider value={contextValue}>
        <RootPrimitive data-disabled={disabled ? '' : undefined} data-slot="file-upload" dir={dir} {...rootProps} className={cn('relative flex flex-col gap-2', className)}>
          {children}
          <input
            type="file"
            id={inputId}
            aria-labelledby={labelId}
            aria-describedby={dropzoneId}
            ref={inputRef}
            tabIndex={-1}
            accept={accept}
            name={name}
            className="sr-only"
            disabled={disabled}
            multiple={multiple}
            required={required}
            onChange={onInputChange}
          />
          <span id={labelId} className="sr-only">
            {label ?? 'File upload'}
          </span>
        </RootPrimitive>
      </FileUploadContext.Provider>
    </StoreContext.Provider>
  );
}

interface FileUploadDropzoneProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
}

function FileUploadDropzone(props: FileUploadDropzoneProps) {
  const { asChild, className, onClick: onClickProp, onDragOver: onDragOverProp, onDragEnter: onDragEnterProp, onDragLeave: onDragLeaveProp, onDrop: onDropProp, onPaste: onPasteProp, onKeyDown: onKeyDownProp, ...dropzoneProps } = props;

  const context = useFileUploadContext(DROPZONE_NAME);
  const store = useStoreContext(DROPZONE_NAME);
  const dragOver = useStore((state) => state.dragOver);
  const invalid = useStore((state) => state.invalid);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClickProp?.(event);

      if (event.defaultPrevented) return;

      const target = event.target;

      const isFromTrigger = target instanceof HTMLElement && target.closest('[data-slot="file-upload-trigger"]');

      if (!isFromTrigger) {
        context.inputRef.current?.click();
      }
    },
    [context.inputRef, onClickProp],
  );

  const onDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      onDragOverProp?.(event);

      if (event.defaultPrevented) return;

      event.preventDefault();
      store.dispatch({ type: 'SET_DRAG_OVER', dragOver: true });
    },
    [store, onDragOverProp],
  );

  const onDragEnter = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      onDragEnterProp?.(event);

      if (event.defaultPrevented) return;

      event.preventDefault();
      store.dispatch({ type: 'SET_DRAG_OVER', dragOver: true });
    },
    [store, onDragEnterProp],
  );

  const onDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      onDragLeaveProp?.(event);

      if (event.defaultPrevented) return;

      const relatedTarget = event.relatedTarget;
      if (relatedTarget && relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
        return;
      }

      event.preventDefault();
      store.dispatch({ type: 'SET_DRAG_OVER', dragOver: false });
    },
    [store, onDragLeaveProp],
  );

  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      onDropProp?.(event);

      if (event.defaultPrevented) return;

      event.preventDefault();
      store.dispatch({ type: 'SET_DRAG_OVER', dragOver: false });

      const files = [...event.dataTransfer.files];
      const inputElement = context.inputRef.current;
      if (!inputElement) return;

      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }

      // eslint-disable-next-line react-hooks/immutability
      inputElement.files = dataTransfer.files;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [store, context.inputRef, onDropProp],
  );

  const onPaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      onPasteProp?.(event);

      if (event.defaultPrevented) return;

      event.preventDefault();
      store.dispatch({ type: 'SET_DRAG_OVER', dragOver: false });

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const items = event.clipboardData?.items;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (item?.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length === 0) return;

      const inputElement = context.inputRef.current;
      if (!inputElement) return;

      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }

      // eslint-disable-next-line react-hooks/immutability
      inputElement.files = dataTransfer.files;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [store, context.inputRef, onPasteProp],
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDownProp?.(event);

      if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        context.inputRef.current?.click();
      }
    },
    [context.inputRef, onKeyDownProp],
  );

  const DropzonePrimitive = asChild ? Slot : 'div';

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <DropzonePrimitive
      role="region"
      id={context.dropzoneId}
      aria-controls={`${context.inputId} ${context.listId}`}
      aria-disabled={context.disabled}
      aria-invalid={invalid}
      data-disabled={context.disabled ? '' : undefined}
      data-dragging={dragOver ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      data-slot="file-upload-dropzone"
      dir={context.dir}
      tabIndex={context.disabled ? undefined : 0}
      {...dropzoneProps}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors outline-none select-none hover:bg-zinc-100/30 focus-visible:border-zinc-400/50 data-[disabled]:pointer-events-none data-[dragging]:border-zinc-400/30 data-[dragging]:bg-zinc-100/30 data-[invalid]:border-red-700 data-[invalid]:ring-red-700/20',
        className,
      )}
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}

interface FileUploadTriggerProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
}

function FileUploadTrigger(props: FileUploadTriggerProps) {
  const { asChild, onClick: onClickProp, ...triggerProps } = props;
  const context = useFileUploadContext(TRIGGER_NAME);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClickProp?.(event);

      if (event.defaultPrevented) return;

      context.inputRef.current?.click();
    },
    [context.inputRef, onClickProp],
  );

  const TriggerPrimitive = asChild ? Slot : 'button';

  return <TriggerPrimitive type="button" aria-controls={context.inputId} data-disabled={context.disabled ? '' : undefined} data-slot="file-upload-trigger" {...triggerProps} disabled={context.disabled} onClick={onClick} />;
}

interface FileUploadListProps extends React.ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
  asChild?: boolean;
  forceMount?: boolean;
}

function FileUploadList(props: FileUploadListProps) {
  const { className, orientation = 'vertical', asChild, forceMount, ...listProps } = props;

  const context = useFileUploadContext(LIST_NAME);
  const fileCount = useStore((state) => state.files.size);
  const shouldRender = forceMount ?? fileCount > 0;

  if (!shouldRender) return null;

  const ListPrimitive = asChild ? Slot : 'div';

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <ListPrimitive
      role="list"
      id={context.listId}
      aria-orientation={orientation}
      data-orientation={orientation}
      data-slot="file-upload-list"
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      data-state={shouldRender ? 'active' : 'inactive'}
      dir={context.dir}
      {...listProps}
      className={cn(
        'data-[state=inactive]:fade-out-0 data-[state=active]:fade-in-0 data-[state=inactive]:slide-out-to-top-2 data-[state=active]:slide-in-from-top-2 data-[state=active]:animate-in data-[state=inactive]:animate-out flex flex-col gap-2',
        orientation === 'horizontal' && 'flex-row overflow-x-auto p-1.5',
        className,
      )}
    />
  );
}

interface FileUploadItemContextValue {
  id: string;
  fileState: FileState | undefined;
  nameId: string;
  sizeId: string;
  statusId: string;
  messageId: string;
}

const FileUploadItemContext = React.createContext<FileUploadItemContextValue | null>(null);

function useFileUploadItemContext(consumerName: string) {
  const context = React.useContext(FileUploadItemContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ITEM_NAME}\``);
  }
  return context;
}

interface FileUploadItemProps extends React.ComponentProps<'div'> {
  value: File;
  asChild?: boolean;
}

function FileUploadItem(props: FileUploadItemProps) {
  const { value, asChild, className, ...itemProps } = props;

  const id = React.useId();
  const statusId = `${id}-status`;
  const nameId = `${id}-name`;
  const sizeId = `${id}-size`;
  const messageId = `${id}-message`;

  const context = useFileUploadContext(ITEM_NAME);
  const fileState = useStore((state) => state.files.get(value));
  const fileCount = useStore((state) => state.files.size);
  const fileIndex = useStore((state) => {
    const files = [...state.files.keys()];
    return files.indexOf(value) + 1;
  });

  const itemContext = React.useMemo(
    () => ({
      id,
      fileState,
      nameId,
      sizeId,
      statusId,
      messageId,
    }),
    [id, fileState, statusId, nameId, sizeId, messageId],
  );

  if (!fileState) return null;

  // eslint-disable-next-line unicorn/no-nested-ternary
  const statusText = fileState.error ? `Error: ${fileState.error}` : fileState.status === 'uploading' ? `Uploading: ${fileState.progress}% complete` : fileState.status === 'success' ? 'Upload complete' : 'Ready to upload';

  const ItemPrimitive = asChild ? Slot : 'div';

  return (
    <FileUploadItemContext.Provider value={itemContext}>
      <ItemPrimitive
        role="listitem"
        id={id}
        aria-setsize={fileCount}
        aria-posinset={fileIndex}
        aria-describedby={`${nameId} ${sizeId} ${statusId} ${fileState.error ? messageId : ''}`}
        aria-labelledby={nameId}
        data-slot="file-upload-item"
        dir={context.dir}
        {...itemProps}
        className={cn('relative flex items-center gap-2.5 rounded-md border p-3', className)}
      >
        {props.children}
        <span id={statusId} className="sr-only">
          {statusText}
        </span>
      </ItemPrimitive>
    </FileUploadItemContext.Provider>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}

function getFileIcon(file: File) {
  const type = file.type;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (type.startsWith('image/')) {
    return <FontAwesomeIcon icon={faFileImage} />;
  }

  if (type.startsWith('video/')) {
    return <FontAwesomeIcon icon={faFileVideo} />;
  }

  if (type.startsWith('audio/')) {
    return <FontAwesomeIcon icon={faFileAudio} />;
  }

  if (type.startsWith('text/') || ['txt', 'md', 'rtf', 'pdf'].includes(extension)) {
    return <FontAwesomeIcon icon={faFileText} />;
  }

  if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'php', 'py', 'rb', 'java', 'c', 'cpp', 'cs'].includes(extension)) {
    return <FontAwesomeIcon icon={faFileCode} />;
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return <FontAwesomeIcon icon={faFileArchive} />;
  }

  if (['exe', 'msi', 'app', 'apk', 'deb', 'rpm'].includes(extension) || type.startsWith('application/')) {
    return <FontAwesomeIcon icon={faGear} />;
  }

  return <FontAwesomeIcon icon={faFile} />;
}

interface FileUploadItemPreviewProps extends React.ComponentProps<'div'> {
  render?: (file: File, fallback: () => React.ReactNode) => React.ReactNode;
  asChild?: boolean;
}

function FileUploadItemPreview(props: FileUploadItemPreviewProps) {
  const { asChild, children, className, ...previewProps } = props;

  const itemContext = useFileUploadItemContext(ITEM_PREVIEW_NAME);

  if (!itemContext.fileState) return null;

  const ItemPreviewPrimitive = asChild ? Slot : 'div';

  return (
    <ItemPreviewPrimitive aria-labelledby={itemContext.nameId} data-slot="file-upload-preview" {...previewProps} className={cn('relative flex shrink-0 items-center justify-center overflow-hidden [&>svg]:size-10', className)}>
      {getFileIcon(itemContext.fileState.file)}
      {children}
    </ItemPreviewPrimitive>
  );
}

interface FileUploadItemMetadataProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
  size?: 'default' | 'sm';
}

function FileUploadItemMetadata(props: FileUploadItemMetadataProps) {
  const { asChild, size = 'default', children, className, ...metadataProps } = props;

  const context = useFileUploadContext(ITEM_METADATA_NAME);
  const itemContext = useFileUploadItemContext(ITEM_METADATA_NAME);

  if (!itemContext.fileState) return null;

  const ItemMetadataPrimitive = asChild ? Slot : 'div';

  return (
    <ItemMetadataPrimitive data-slot="file-upload-metadata" dir={context.dir} {...metadataProps} className={cn('flex min-w-0 flex-1 flex-col', className)}>
      {children ?? (
        <>
          <span id={itemContext.nameId} className={cn('truncate font-semibold', size === 'sm' && 'leading-snug')}>
            {itemContext.fileState.file.name}
          </span>
          <span id={itemContext.sizeId} className={cn('zinc-500 truncate text-sm', size === 'sm' && 'leading-snug')}>
            {formatBytes(itemContext.fileState.file.size)}
          </span>
          {itemContext.fileState.error && (
            <span id={itemContext.messageId} className="text-xs text-red-700">
              {itemContext.fileState.error}
            </span>
          )}
        </>
      )}
    </ItemMetadataPrimitive>
  );
}

interface FileUploadItemDeleteProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
}

function FileUploadItemDelete(props: FileUploadItemDeleteProps) {
  const { asChild, onClick: onClickProp, ...deleteProps } = props;

  const store = useStoreContext(ITEM_DELETE_NAME);
  const itemContext = useFileUploadItemContext(ITEM_DELETE_NAME);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClickProp?.(event);

      if (!itemContext.fileState || event.defaultPrevented) return;

      store.dispatch({
        type: 'REMOVE_FILE',
        file: itemContext.fileState.file,
      });
    },
    [store, itemContext.fileState, onClickProp],
  );

  if (!itemContext.fileState) return null;

  const ItemDeletePrimitive = asChild ? Slot : 'button';

  return <ItemDeletePrimitive type="button" aria-controls={itemContext.id} aria-describedby={itemContext.nameId} data-slot="file-upload-item-delete" {...deleteProps} onClick={onClick} />;
}

interface FileUploadClearProps extends React.ComponentProps<'button'> {
  forceMount?: boolean;
  asChild?: boolean;
}

function FileUploadClear(props: FileUploadClearProps) {
  const { asChild, forceMount, disabled, onClick: onClickProp, ...clearProps } = props;

  const context = useFileUploadContext(CLEAR_NAME);
  const store = useStoreContext(CLEAR_NAME);
  const fileCount = useStore((state) => state.files.size);

  const isDisabled = disabled ?? context.disabled;

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClickProp?.(event);

      if (event.defaultPrevented) return;

      store.dispatch({ type: 'CLEAR' });
    },
    [store, onClickProp],
  );

  const shouldRender = forceMount ?? fileCount > 0;

  if (!shouldRender) return null;

  const ClearPrimitive = asChild ? Slot : 'button';

  return <ClearPrimitive type="button" aria-controls={context.listId} data-slot="file-upload-clear" data-disabled={isDisabled ? '' : undefined} {...clearProps} disabled={isDisabled} onClick={onClick} />;
}

export {
  FileUploadRoot as FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadClear,
  //
  FileUploadRoot as Root,
  FileUploadDropzone as Dropzone,
  FileUploadTrigger as Trigger,
  FileUploadList as List,
  FileUploadItem as Item,
  FileUploadItemPreview as ItemPreview,
  FileUploadItemMetadata as ItemMetadata,
  FileUploadItemDelete as ItemDelete,
  FileUploadClear as Clear,
  //
  useStore as useFileUpload,
  //
  type FileUploadRootProps as FileUploadProps,
};

import { forwardRef, useEffect } from 'react';
import type { ComponentProps } from 'react';

import { faCircleCheck, faCircleInfo, faExclamationCircle, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MaterialDesignContent, SnackbarProvider, enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { setToastCookieOptions } from 'remix-toast';
import type { ToastMessage } from 'remix-toast';

import { useI18nNamespaces } from '~/utils/route-utils';
import { cn } from '~/utils/tw-utils';

export interface ToasterProps {
  toast?: ToastMessage;
}

export function Toaster({ toast }: ToasterProps) {
  setToastCookieOptions({
    // TODO :: GjB :: make these configurable
    name: '__CDCP//toast',
    sameSite: 'lax',
    secure: true,
  });

  useEffect(() => {
    if (toast?.message) {
      enqueueSnackbar(toast.message, { variant: toast.type });
    }
  }, [toast]);

  return (
    <SnackbarProvider
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      Components={{
        default: DefaultSnackbar,
        error: ErrorSnackbar,
        info: InfoSnackbar,
        success: SuccessSnackbar,
        warning: WarningSnackbar,
      }}
      iconVariant={{
        error: <FontAwesomeIcon icon={faExclamationCircle} className="me-2 size-5" />,
        info: <FontAwesomeIcon icon={faCircleInfo} className="me-2 size-5" />,
        success: <FontAwesomeIcon icon={faCircleCheck} className="me-2 size-5" />,
        warning: <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 size-5" />,
      }}
    />
  );
}

interface SnackbarProps extends ComponentProps<typeof MaterialDesignContent> {}

const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, message, ...props }, ref) => {
  const ns = useI18nNamespaces();
  const { t } = useTranslation(ns);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const translatedMessage = t(message as any, { defaultValue: message });
  return <MaterialDesignContent ref={ref} className={cn('!rounded-lg !border', className)} message={translatedMessage} {...props} />;
});

Snackbar.displayName = 'Snackbar';

const DefaultSnackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, ...props }, ref) => {
  return <Snackbar ref={ref} className={cn(className, '!border-gray-300 !bg-gray-50 !text-gray-800')} {...props} />;
});

DefaultSnackbar.displayName = 'DefaultSnackbar';

const ErrorSnackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, ...props }, ref) => {
  return <Snackbar ref={ref} className={cn(className, '!border-red-300 !bg-red-50 !text-red-800')} {...props} />;
});

ErrorSnackbar.displayName = 'ErrorSnackbar';

const InfoSnackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, ...props }, ref) => {
  return <Snackbar ref={ref} className={cn(className, '!border-blue-300 !bg-blue-50 !text-blue-800')} {...props} />;
});

InfoSnackbar.displayName = 'InfoSnackbar';

const SuccessSnackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, ...props }, ref) => {
  return <Snackbar ref={ref} className={cn(className, '!border-green-300 !bg-green-50 !text-green-800')} {...props} />;
});

SuccessSnackbar.displayName = 'SuccessSnackbar';

const WarningSnackbar = forwardRef<HTMLDivElement, SnackbarProps>(({ className, ...props }, ref) => {
  return <Snackbar ref={ref} className={cn(className, '!border-yellow-300 !bg-yellow-50 !text-yellow-800')} {...props} />;
});

WarningSnackbar.displayName = 'WarningSnackbar';

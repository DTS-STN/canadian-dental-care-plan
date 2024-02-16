import { useEffect } from 'react';

import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import type { ToastMessage } from 'remix-toast';

import { SnackbarMessage } from '~/components/snackbar-message';

export interface ToasterProps {
  toast?: ToastMessage;
}

export function Toaster({ toast }: ToasterProps) {
  useEffect(() => {
    if (toast?.message) {
      enqueueSnackbar(<SnackbarMessage message={toast.message} />, { variant: toast.type });
    }
  }, [toast]);

  return <SnackbarProvider className="bg-green-700" anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} />;
}

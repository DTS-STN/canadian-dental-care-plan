import { useEffect } from 'react';

import { ToastContainer, toast as notify } from 'react-toastify';
import type { ToastMessage } from 'remix-toast';

export interface ToasterProps {
  toast?: ToastMessage;
}

export function Toaster({ toast }: ToasterProps) {
  useEffect(() => {
    if (toast) {
      notify(toast.message, { type: toast.type });
    }
  }, [toast]);

  return <ToastContainer newestOnTop position="bottom-right" />;
}

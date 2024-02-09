import { useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { ToastContainer, toast as notify } from 'react-toastify';
import type { ToastMessage } from 'remix-toast';

import { useI18nNamespaces } from '~/utils/route-utils';

export interface ToasterProps {
  toast?: ToastMessage;
}

export function Toaster({ toast }: ToasterProps) {
  const ns = useI18nNamespaces();
  const { t } = useTranslation(ns);
  const translatedMessage = toast ? t(toast.message) : null;
  useEffect(() => {
    if (toast) {
      notify(translatedMessage, { type: toast.type });
    }
  }, [toast, translatedMessage]);

  return <ToastContainer newestOnTop position="bottom-right" />;
}

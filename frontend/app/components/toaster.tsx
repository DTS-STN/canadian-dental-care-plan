import { useEffect } from 'react';

import { MaterialDesignContent, SnackbarProvider, enqueueSnackbar } from 'notistack';
import type { ToastMessage } from 'remix-toast';
import { styled } from 'styled-components';

import { SnackbarMessage } from '~/components/snackbar-message';

export interface ToasterProps {
  toast?: ToastMessage;
}

const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
  '&.notistack-MuiContent-success': {
    backgroundColor: '#2D7738',
  },
  '&.notistack-MuiContent-error': {
    backgroundColor: '#970C0C',
  },
  '&.notistack-MuiContent-warning': {
    backgroundColor: '#8D7007',
  },
  '&.notistack-MuiContent-info': {
    backgroundColor: '#0676CF',
  },
}));

export function Toaster({ toast }: ToasterProps) {
  useEffect(() => {
    if (toast?.message) {
      enqueueSnackbar(<SnackbarMessage message={toast.message} />, { variant: toast.type });
    }
  }, [toast]);

  return (
    <SnackbarProvider
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      Components={{
        success: StyledMaterialDesignContent,
        error: StyledMaterialDesignContent,
        warning: StyledMaterialDesignContent,
        info: StyledMaterialDesignContent,
      }}
    />
  );
}

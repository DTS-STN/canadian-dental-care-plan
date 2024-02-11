import { type ComponentProps, forwardRef } from 'react';

import { useTranslation } from 'react-i18next';

import { useI18nNamespaces } from '~/utils/route-utils';

export interface SnackbarMessageProps extends Omit<ComponentProps<'div'>, 'children'> {
  message: string;
}

const SnackbarMessage = forwardRef<HTMLDivElement, SnackbarMessageProps>(({ message, ...props }, ref) => {
  const ns = useI18nNamespaces();
  const { t } = useTranslation(ns);
  return (
    <div {...props} ref={ref}>
      {t(message, { defaultValue: message })}
    </div>
  );
});

SnackbarMessage.displayName = 'SnackbarMessage';

export { SnackbarMessage };

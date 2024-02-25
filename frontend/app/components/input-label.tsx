import type { ComponentProps, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '~/utils/tw-utils';

export interface InputLabelProps extends ComponentProps<'label'> {
  children: ReactNode;
  id: string;
  required?: boolean;
}

export function InputLabel(props: InputLabelProps) {
  const { t } = useTranslation('gcweb');
  const { children, className, required, ...restProps } = props;

  return (
    <label className={cn('inline-block font-medium', className)} data-testid="input-label" {...restProps}>
      <span>{children}</span>
      {required && (
        <>
          &nbsp;
          <i aria-hidden="true" className="font-bold text-red-600">
            *
          </i>
          <strong className="sr-only" data-testid="input-label-required">
            ({t('input-label.required')})
          </strong>
        </>
      )}
    </label>
  );
}

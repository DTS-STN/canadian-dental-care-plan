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
    <label className={cn(required && 'required', className)} data-testid="input-label" {...restProps}>
      <span className="field-name">{children}</span>
      {required && (
        <strong className="required mrgn-lft-sm" data-testid="input-label-required">
          ({t('input-label.required')})
        </strong>
      )}
    </label>
  );
}

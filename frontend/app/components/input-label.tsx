import React, { type ReactNode } from 'react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface InputLabelProps extends Omit<React.ComponentProps<'label'>, ''> {
  children: ReactNode;
  errorMessage?: string;
  id: string;
  required?: boolean;
}

export const InputLabel = (props: InputLabelProps) => {
  const { t } = useTranslation('gcweb');
  const { children, className, errorMessage, id, required, ...restLabelProps } = props;

  return (
    <label className={clsx(required && 'required', className)} id={id} data-testid={`input-label-${id}`} {...restLabelProps}>
      <span className="field-name">{children}</span>
      {required && (
        <strong className="required mrgn-lft-sm" data-testid={`input-label-required-${id}`}>
          ({t('input-label.required')})
        </strong>
      )}
      {errorMessage && (
        <span className="label label-danger wb-server-error" data-testid={`input-label-error-message-${id}`}>
          {errorMessage}
        </span>
      )}
    </label>
  );
};

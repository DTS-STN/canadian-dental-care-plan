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
  const { children, className, errorMessage, required, ...restLabelProps } = props;
  return (
    <label className={clsx(required && 'required', className)} data-testid="input-label" {...restLabelProps}>
      <span className="field-name">{children}</span>
      {required && <strong className="required">&#32;({t('input-label.required')})</strong>}
      {errorMessage && (
        <span className="label label-danger wb-server-error" data-testid="input-error-message">
          {errorMessage}
        </span>
      )}
    </label>
  );
};

import type { ComponentProps, ReactNode } from 'react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface InputLegendProps extends ComponentProps<'legend'> {
  children: ReactNode;
  required?: boolean;
}

export function InputLegend(props: InputLegendProps) {
  const { t } = useTranslation('gcweb');
  const { children, className, required, ...restProps } = props;

  return (
    <legend className={clsx(required && 'required', className)} data-testid="input-legend" {...restProps}>
      <span className="field-name">{children}</span>
      {required && (
        <strong className="required mrgn-lft-sm" data-testid="input-legend-required">
          ({t('input-legend.required')})
        </strong>
      )}
    </legend>
  );
}

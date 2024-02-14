import type { ComponentProps, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '~/utils/tw-utils';

export interface InputLegendProps extends ComponentProps<'legend'> {
  children: ReactNode;
  required?: boolean;
}

export function InputLegend(props: InputLegendProps) {
  const { t } = useTranslation('gcweb');
  const { children, className, required, ...restProps } = props;

  return (
    <legend className={cn(required && 'required', className)} data-testid="input-legend" {...restProps}>
      <span className="field-name">{children}</span>
      {required && (
        <strong className="required mrgn-lft-sm" data-testid="input-legend-required">
          ({t('input-legend.required')})
        </strong>
      )}
    </legend>
  );
}

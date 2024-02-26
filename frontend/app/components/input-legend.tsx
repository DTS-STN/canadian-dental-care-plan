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
    <legend className={cn('block font-medium', className)} data-testid="input-legend" {...restProps}>
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
    </legend>
  );
}

import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputLegendProps extends ComponentProps<'legend'> {
  children: ReactNode;
}

export function InputLegend(props: InputLegendProps) {
  const { children, className, ...restProps } = props;

  return (
    <legend className={cn('block font-semibold', className)} {...restProps}>
      <span>{children}</span>
    </legend>
  );
}

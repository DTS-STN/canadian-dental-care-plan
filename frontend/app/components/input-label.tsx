import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputLabelProps extends ComponentProps<'label'> {
  children: ReactNode;
  id: string;
}

export function InputLabel(props: InputLabelProps) {
  const { children, className, ...restProps } = props;

  return (
    <label className={cn('inline-block font-semibold', className)} {...restProps}>
      <span>{children}</span>
    </label>
  );
}

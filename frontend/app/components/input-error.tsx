import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputErrorProps extends ComponentProps<'div'> {
  children: ReactNode;
  id: string;
}

export function InputError(props: InputErrorProps) {
  const { children, className, ...restProps } = props;
  return (
    <div className={cn('w-fit max-w-prose border-l-2 border-red-600 bg-red-50 px-3 py-1', className)} role="alert" {...restProps}>
      {children}
    </div>
  );
}

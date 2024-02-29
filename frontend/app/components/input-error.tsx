import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputErrorProps extends ComponentProps<'span'> {
  children: ReactNode;
  id: string;
}

export function InputError(props: InputErrorProps) {
  const { children, className, ...restProps } = props;
  return (
    <span className={cn('block max-w-prose font-semibold text-red-600', className)} data-testid="input-error-test-id" role="alert" {...restProps}>
      {children}
    </span>
  );
}

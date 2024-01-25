import type { ComponentProps, ReactNode } from 'react';

import clsx from 'clsx';

export interface InputErrorProps extends ComponentProps<'span'> {
  children: ReactNode;
  id: string;
}

export function InputError(props: InputErrorProps) {
  const { children, className, ...restProps } = props;
  return (
    <span className={clsx('label label-danger wb-server-error', className)} data-testid="input-error-test-id" {...restProps}>
      {children}
    </span>
  );
}

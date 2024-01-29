import type { ComponentProps, ReactNode } from 'react';

import clsx from 'clsx';

export interface InputHelpProps extends ComponentProps<'span'> {
  children: ReactNode;
  id: string;
}

export function InputHelp(props: InputHelpProps) {
  const { children, className, ...restProps } = props;
  return (
    <span className={clsx('block max-w-prose text-base text-gray-600', className)} data-testid="input-help" {...restProps}>
      {children}
    </span>
  );
}

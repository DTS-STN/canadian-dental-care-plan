import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputHelpProps extends ComponentProps<'div'> {
  children: ReactNode;
  id: string;
}

export function InputHelp(props: InputHelpProps) {
  const { children, className, ...restProps } = props;
  return (
    <div className={cn('max-w-prose text-gray-500', className)} {...restProps}>
      {children}
    </div>
  );
}

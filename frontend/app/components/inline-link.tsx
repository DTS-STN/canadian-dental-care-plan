import type { ComponentProps } from 'react';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tw-utils';

export interface InlineLinkProps extends ComponentProps<typeof AppLink> {}

export function InlineLink({ className, children, ...props }: InlineLinkProps) {
  return (
    <AppLink className={cn('text-slate-700 underline hover:text-blue-700 focus:text-blue-700', className)} {...props}>
      {children}
    </AppLink>
  );
}

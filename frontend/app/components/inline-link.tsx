import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';

import { cn } from '~/utils/tw-utils';

export interface InlineLinkProps extends ComponentProps<typeof Link> {}

export function InlineLink({ className, children, ...props }: InlineLinkProps) {
  return (
    <Link className={cn('text-slate-700 underline hover:text-blue-700 focus:text-blue-700', className)} {...props}>
      {children}
    </Link>
  );
}

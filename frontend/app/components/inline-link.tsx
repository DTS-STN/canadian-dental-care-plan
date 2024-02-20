import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';

import { cn } from '~/utils/tw-utils';

export interface InlineLinkProps extends ComponentProps<typeof Link> {}

export function InlineLink({ className, children, ...props }: InlineLinkProps) {
  return (
    <Link className={cn('text-blue-700 hover:underline', className)} {...props}>
      {children}
    </Link>
  );
}

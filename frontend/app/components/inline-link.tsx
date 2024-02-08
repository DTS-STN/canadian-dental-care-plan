import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';

import clsx from 'clsx';

export interface InlineLinkProps extends ComponentProps<typeof Link> {}

export function InlineLink({ className, children, ...props }: InlineLinkProps) {
  return (
    <Link className={clsx('text-blue-600 hover:underline', className)} {...props}>
      {children}
    </Link>
  );
}

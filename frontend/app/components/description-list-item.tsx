import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface DescriptionListItemProps extends PropsWithChildren {
  className?: string;
  term: ReactNode;
}

export function DescriptionListItem({ className, children, term }: DescriptionListItemProps) {
  return (
    <div className={cn('py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6', className)}>
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

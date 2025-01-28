import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

export function PageTitle({ children, className, ...restProps }: OmitStrict<ComponentProps<'h1'>, 'id' | 'property'>) {
  return (
    <h1 id="wb-cont" tabIndex={-1} className={cn('font-lato text-3xl font-bold focus-visible:ring-3', className)} property="name" {...restProps}>
      {children}
    </h1>
  );
}

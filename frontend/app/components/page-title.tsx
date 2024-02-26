import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

export function PageTitle({ children, className, ...restProps }: Omit<ComponentProps<'h1'>, 'id' | 'property'>) {
  return (
    <h1 id="wb-cont" className={cn('mb-2 mt-6 font-lato text-3xl font-extrabold', className)} property="name" {...restProps}>
      {children}
    </h1>
  );
}

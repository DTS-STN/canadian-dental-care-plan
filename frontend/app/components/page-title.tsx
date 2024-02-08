import type { ComponentProps } from 'react';

import clsx from 'clsx';

export function PageTitle({ children, className, ...restProps }: Omit<ComponentProps<'h1'>, 'id' | 'property'>) {
  return (
    <h1 id="wb-cont" className={clsx('mb-2 mt-9 border-b border-pink-800 pb-2 text-4xl font-bold', className)} property="name" {...restProps}>
      {children}
    </h1>
  );
}

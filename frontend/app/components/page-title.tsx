import type { ComponentProps } from 'react';

export function PageTitle({ children, ...restProps }: Omit<ComponentProps<'h1'>, 'id' | 'property'>) {
  return (
    <h1 id="wb-cont" property="name" {...restProps}>
      {children}
    </h1>
  );
}

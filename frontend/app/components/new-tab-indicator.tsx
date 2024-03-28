import type { ComponentProps, ReactNode } from 'react';

export interface NewTabIndicatorProps extends ComponentProps<'span'> {
  children: ReactNode;
}

export function NewTabIndicator(props: NewTabIndicatorProps) {
  const { children } = props;
  return <span className="sr-only">{children}</span>;
}

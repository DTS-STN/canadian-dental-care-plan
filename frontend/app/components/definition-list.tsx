import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export type DefinitionListProps = ComponentProps<'dl'> & {
  border?: boolean;
  layout?: 'single-column' | 'two-column';
};

export function DefinitionList({ border, className, layout = 'two-column', ...props }: DefinitionListProps) {
  return <dl className={cn('group data-[border=false]:space-y-6 data-[border=true]:divide-y data-[border=true]:border-y', className)} data-layout={layout} data-border={border ?? false} {...props} />;
}

export function DefinitionListGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-2 group-data-[border=true]:py-4 group-data-[layout=two-column]:sm:grid-cols-3 group-data-[layout=two-column]:sm:gap-4 group-data-[layout=two-column]:group-data-[border=true]:sm:py-6', className)} {...props} />;
}

export function DefinitionListTerm({ className, ...props }: ComponentProps<'dt'>) {
  return <dt className={cn('font-semibold', className)} {...props} />;
}

export function DefinitionListDescription({ className, ...props }: ComponentProps<'dd'>) {
  return <dd className={cn('group-data-[layout=two-column]:sm:col-span-2', className)} {...props} />;
}

type DefinitionListItemProps = {
  className?: string;
  term: ReactNode;
  children: ReactNode;
};

/**
 * Definition List Item component that combines term and description wrapped in a group for convenience.
 */
export function DefinitionListItem({ className, term, children }: DefinitionListItemProps) {
  return (
    <DefinitionListGroup className={className}>
      <DefinitionListTerm>{term}</DefinitionListTerm>
      <DefinitionListDescription>{children}</DefinitionListDescription>
    </DefinitionListGroup>
  );
}

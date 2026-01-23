import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

export type DefinitionListProps = ComponentProps<'dl'> & { layout?: 'single-column' | 'two-column' };

export function DefinitionList({ className, layout = 'two-column', ...props }: DefinitionListProps) {
  return <dl className={cn('group', className)} data-layout={layout} {...props} />;
}

export function DefinitionListGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-3 py-4 group-data-[layout=two-column]:sm:grid-cols-3 group-data-[layout=two-column]:sm:gap-4 group-data-[layout=two-column]:sm:py-6', className)} {...props} />;
}

export function DefinitionListTerm({ className, ...props }: ComponentProps<'dt'>) {
  return <dt className={cn('font-semibold', className)} {...props} />;
}

export function DefinitionListDescription({ className, ...props }: ComponentProps<'dd'>) {
  return <dd className={cn('group-data-[layout=two-column]:sm:col-span-2', className)} {...props} />;
}

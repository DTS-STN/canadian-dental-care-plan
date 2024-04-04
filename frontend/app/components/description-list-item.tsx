import { ReactNode } from 'react';

export interface DescriptionListItemProps {
  children: ReactNode;
  term: ReactNode;
}

export function DescriptionListItem({ children, term }: DescriptionListItemProps) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-3 space-y-3 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

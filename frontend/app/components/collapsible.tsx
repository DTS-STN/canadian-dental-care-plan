import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface CollapsibleSummaryProps extends ComponentProps<'summary'> {}

export function CollapsibleSummary({ children, className, ...props }: CollapsibleSummaryProps) {
  return (
    <summary className={cn('cursor-pointer text-blue-900 underline', className)} {...props}>
      <span className="ml-4">{children}</span>
    </summary>
  );
}

export interface CollapsibleProps extends ComponentProps<'details'> {
  contentClassName?: string;
  summary: ReactNode;
}

export function Collapsible({ children, contentClassName, id, summary, ...props }: CollapsibleProps) {
  const uniqueId = useId();
  const summaryId = `${id ?? uniqueId}-summary`;
  const contentId = `${id ?? uniqueId}-content`;
  return (
    <details id={id ?? uniqueId} {...props}>
      <CollapsibleSummary id={summaryId}>{summary}</CollapsibleSummary>
      <div id={contentId} className={cn('mt-2 border-l-[6px] border-gray-400 px-6 py-4', contentClassName)}>
        {children}
      </div>
    </details>
  );
}

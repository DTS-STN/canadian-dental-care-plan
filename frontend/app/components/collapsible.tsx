import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface CollapsibleDetailsProps extends ComponentProps<'details'> {
  id: string;
  summary: ReactNode;
}

export interface CollapsibleSummaryProps extends ComponentProps<'summary'> {
  id: string;
}

export function CollapsibleSummary({ children, className, ...props }: CollapsibleSummaryProps) {
  return (
    <summary className={cn('cursor-pointer text-blue-900 underline', className)} {...props}>
      <span className="ml-4">{children}</span>
    </summary>
  );
}

export function CollapsibleDetails({ children, id, className, summary, ...props }: CollapsibleDetailsProps) {
  const summaryId = `${id}-summary`;
  const contentId = `${id}-content`;
  return (
    <details className="mb-4 mt-4" {...props}>
      <CollapsibleSummary id={summaryId}>{summary}</CollapsibleSummary>
      <div id={contentId} className={cn('mt-2 border-l-[6px] border-gray-400 px-6 py-4', className)}>
        {children}
      </div>
    </details>
  );
}

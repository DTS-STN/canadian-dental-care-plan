import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface CollapsibleDetailsProps extends ComponentProps<'details'> {
  id: string;
  summary: ReactNode;
}

export interface CollapsibleSummaryProps extends ComponentProps<'summary'> {
  id: string;
}

export function CollapsibleSummary({ id, children, className, ...props }: CollapsibleSummaryProps) {
  const headerId = `${id}-header`;

  return (
    <summary>
      <span id={headerId} className={cn('inline text-blue-900 underline', className)}>
        {children}
      </span>
    </summary>
  );
}

export function CollapsibleDetails({ children, id, className, summary, ...props }: CollapsibleDetailsProps) {
  const detailsId = `${id}-details`;
  const summaryId = `${id}-summary`;
  const contentId = `${id}-content`;

  return (
    <details id={detailsId}>
      <CollapsibleSummary id={summaryId}>{summary}</CollapsibleSummary>
      <div id={contentId} className={cn('mt-2 border-l-[6px] border-gray-400 px-6 py-4', className)}>
        {children}
      </div>
    </details>
  );
}

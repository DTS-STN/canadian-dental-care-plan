import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('bg-gray-50', className)} {...props} />;
}

function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" {...props} />;
}

function TableFooter(props: ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" {...props} />;
}

function TableRow(props: ComponentProps<'tr'>) {
  return <tr data-slot="table-row" {...props} />;
}

function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return <th data-slot="table-head text-left" className={cn('px-6 py-3 text-left', className)} {...props} />;
}

function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td data-slot="table-cell" className={cn('px-6 py-4', className)} {...props} />;
}

function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('p-5 text-left', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

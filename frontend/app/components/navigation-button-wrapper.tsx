import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

export function NavigationButtonWrapper({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col justify-end gap-2.5 sm:flex-row-reverse sm:flex-wrap sm:items-center', className)} {...props} />;
}

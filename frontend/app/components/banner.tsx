import type { ComponentProps, ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

interface BannerProps extends ComponentProps<'div'> {
  alert?: ReactNode;
  description?: ReactNode;
}

export function Banner({ alert, className, description, ...restProps }: BannerProps) {
  return (
    <div className={cn('font-body bg-slate-700 text-white', className)} {...restProps}>
      <div className="container mx-auto flex flex-col space-y-2 p-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
        <div className="w-max border-2 border-current px-4 py-1 whitespace-nowrap">{alert}</div>
        <div>{description}</div>
      </div>
    </div>
  );
}

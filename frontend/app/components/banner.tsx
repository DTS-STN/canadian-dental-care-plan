import type { ReactNode } from 'react';

interface BannerProps {
  alert?: ReactNode;
  description?: ReactNode;
}

export function Banner({ alert, description }: BannerProps) {
  return (
    <div className="font-body bg-slate-700 text-white" data-testid="banner-id">
      <div className="container mx-auto flex flex-col space-y-2 p-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
        <div className="w-max whitespace-nowrap border-2 border-current px-4 py-1">{alert}</div>
        <div>{description}</div>
      </div>
    </div>
  );
}

import React from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { useCurrentLanguage } from '~/hooks';
import { formatPercent } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

const sizes = {
  sx: 'h-1',
  sm: 'h-1.5',
  base: 'h-2.5',
  lg: 'h-4',
  xl: 'h-6',
};

const variants = {
  blue: 'bg-blue-600',
  default: 'bg-gray-600',
  green: 'bg-green-600',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
};

const rootBaseClassName = 'relative w-full overflow-hidden rounded-full bg-gray-200';
const indicatorBaseClassName = 'h-full w-full flex-1 transition-all';

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  label: string;
  value: number;
}

const Progress = React.forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(({ className, size = 'base', variant = 'default', value, label, ...props }, ref) => {
  const { currentLanguage } = useCurrentLanguage();
  return (
    <>
      {label && <p id="progress-label" className="mb-2">{`${label} ${formatPercent(value, currentLanguage)}`}</p>}
      <ProgressPrimitive.Root ref={ref} className={cn(rootBaseClassName, sizes[size], className)} data-testid="progress-root" value={value} {...props} aria-labelledby={label && 'progress-label'}>
        <ProgressPrimitive.Indicator className={cn(indicatorBaseClassName, variants[variant])} style={{ transform: `translateX(-${100 - value}%)` }} data-testid="progress-indicator" />
      </ProgressPrimitive.Root>
    </>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

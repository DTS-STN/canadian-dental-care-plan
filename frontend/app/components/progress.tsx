import type React from 'react';
import { useId } from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { useCurrentLanguage } from '~/hooks';
import { formatPercent } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

const sizeStyles = {
  sx: 'h-1',
  sm: 'h-1.5',
  base: 'h-2.5',
  lg: 'h-4',
  xl: 'h-6',
};

const variantStyles = {
  blue: 'bg-blue-600',
  default: 'bg-gray-600',
  green: 'bg-green-600',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
};

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  size?: keyof typeof sizeStyles;
  variant?: keyof typeof variantStyles;
  label: string;
  value: number;
}

export function Progress({ className, size = 'base', variant = 'default', value, label, ...props }: ProgressProps) {
  const { currentLanguage } = useCurrentLanguage();
  const labelId = useId();

  return (
    <div className="space-y-2">
      {label && <p id={labelId}>{`${label} ${formatPercent(value, currentLanguage)}`}</p>}
      <ProgressPrimitive.Root
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200', //
          sizeStyles[size],
          className,
        )}
        value={value}
        {...props}
        aria-labelledby={labelId}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all', //
            variantStyles[variant],
          )}
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

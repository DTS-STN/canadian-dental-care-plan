import type { ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputDisabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
const inputErrorClassName = 'border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500';

export interface InputRadioProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  append?: ReactNode;
  appendClassName?: string;
  children: ReactNode;
  hasError?: boolean;
  id: string;
  inputClassName?: string;
  labelClassName?: string;
  name: string;
}

export function InputRadio({ append, appendClassName, children, className, hasError, id, inputClassName, labelClassName, ...restProps }: InputRadioProps) {
  const inputRadioId = `input-radio-${id}`;
  const inputLabelId = `${inputRadioId}-label`;
  return (
    <div className={className}>
      <div className="flex items-center">
        <label id={inputLabelId} htmlFor={inputRadioId} className={cn('block leading-6', restProps.disabled && inputDisabledClassName, labelClassName)}>
          <input type="radio" id={inputRadioId} aria-labelledby={inputLabelId} className={cn(inputBaseClassName, restProps.disabled && inputDisabledClassName, hasError && inputErrorClassName, inputClassName)} data-testid="input-radio" {...restProps} />
          <span className="ml-3">{children}</span>
        </label>
      </div>
      {append && <div className={cn('ml-7 mt-4', appendClassName)}>{append}</div>}
    </div>
  );
}

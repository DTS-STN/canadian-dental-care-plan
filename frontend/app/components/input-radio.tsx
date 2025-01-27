import type { ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'h-4 w-4 border-gray-500 text-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500';
const inputDisabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
const inputErrorClassName = 'border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500';
const inputReadOnlyClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export interface InputRadioProps extends OmitStrict<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
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
        <input
          type="radio"
          id={inputRadioId}
          aria-labelledby={inputLabelId}
          className={cn(inputBaseClassName, restProps.readOnly && inputReadOnlyClassName, restProps.disabled && inputDisabledClassName, hasError && inputErrorClassName, inputClassName)}
          data-testid="input-radio"
          {...restProps}
        />
        <label id={inputLabelId} htmlFor={inputRadioId} className={cn('block pl-3 leading-6', restProps.readOnly && inputReadOnlyClassName, restProps.disabled && inputDisabledClassName, labelClassName)}>
          {children}
        </label>
      </div>
      {append && <div className={cn('mt-4 ml-7', appendClassName)}>{append}</div>}
    </div>
  );
}

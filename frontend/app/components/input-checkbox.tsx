import type { ReactNode } from 'react';

import { InputError } from './input-error';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputDisabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
const inputErrorClassName = 'border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500';

export interface InputCheckboxProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  append?: ReactNode;
  appendClassName?: string;
  children: ReactNode;
  errorMessage?: string;
  hasError?: boolean;
  id: string;
  inputClassName?: string;
  labelClassName?: string;
  name: string;
}

export function InputCheckbox({ errorMessage, append, appendClassName, children, className, hasError, id, inputClassName, labelClassName, ...restProps }: InputCheckboxProps) {
  const inputCheckboxId = `input-checkbox-${id}`;
  const inputErrorId = `${inputCheckboxId}-error`;
  const inputLabelId = `${inputCheckboxId}-label`;
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={inputCheckboxId}
          aria-labelledby={inputLabelId}
          aria-errormessage={errorMessage ? inputErrorId : undefined}
          className={cn(inputBaseClassName, restProps.disabled && inputDisabledClassName, (errorMessage ?? hasError) && inputErrorClassName, inputClassName)}
          data-testid="input-checkbox"
          {...restProps}
        />
        <label id={inputLabelId} htmlFor={inputCheckboxId} className={cn('ml-3 block leading-6', restProps.disabled && inputDisabledClassName, labelClassName)}>
          {children}
        </label>
      </div>
      {append && <div className={cn('ml-7 mt-4', appendClassName)}>{append}</div>}
      {errorMessage && (
        <InputError id={inputErrorId} className="mt-2">
          {errorMessage}
        </InputError>
      )}
    </div>
  );
}

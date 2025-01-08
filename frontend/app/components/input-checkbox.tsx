import type { ReactNode } from 'react';

import { InputError } from './input-error';

import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'h-4 w-4 rounded border-gray-500 bg-gray-50 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputDisabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
const inputErrorClassName = 'border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500';
const inputReadOnlyClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export interface InputCheckboxProps extends OmitStrict<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
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
      {errorMessage && (
        <InputError id={inputErrorId} className="my-2">
          {errorMessage}
        </InputError>
      )}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={inputCheckboxId}
          aria-labelledby={inputLabelId}
          aria-errormessage={errorMessage ? inputErrorId : undefined}
          className={cn(inputBaseClassName, restProps.readOnly && inputReadOnlyClassName, restProps.disabled && inputDisabledClassName, (errorMessage ?? hasError) && inputErrorClassName, inputClassName)}
          data-testid="input-checkbox"
          {...restProps}
        />
        <label id={inputLabelId} htmlFor={inputCheckboxId} className={cn('block pl-3 leading-6', restProps.readOnly && inputReadOnlyClassName, restProps.disabled && inputDisabledClassName, labelClassName)}>
          {children}
        </label>
      </div>
      {append && <div className={cn('ml-7 mt-4', appendClassName)}>{append}</div>}
    </div>
  );
}

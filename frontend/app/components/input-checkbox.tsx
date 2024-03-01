import type { ReactNode } from 'react';

import { InputError } from './input-error';
import { cn } from '~/utils/tw-utils';

export interface InputCheckboxProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  append?: ReactNode;
  appendClassName?: string;
  children: ReactNode;
  id: string;
  inputClassName?: string;
  labelClassName?: string;
  name: string;
  errorMessage?: string;
}

const disableClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export function InputCheckbox(props: InputCheckboxProps) {
  const { errorMessage, append, appendClassName, children, className, id, inputClassName, labelClassName, ...restProps } = props;
  const inputErrorId = `input-${id}-error`;
  const inputLabelId = `input-checkbox-${id}-label`;
  const inputCheckboxId = `input-checkbox-${id}`;
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={inputCheckboxId}
          aria-labelledby={inputLabelId}
          className={cn('h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500', restProps.disabled && disableClassName, inputClassName)}
          data-testid="input-checkbox"
          {...restProps}
        />
        <label id={inputLabelId} htmlFor={inputCheckboxId} className={cn('ml-3 block leading-6', restProps.disabled && disableClassName, labelClassName)}>
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

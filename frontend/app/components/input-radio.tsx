import type { ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputRadioProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  append?: ReactNode;
  appendClassName?: string;
  children: ReactNode;
  id: string;
  inputClassName?: string;
  labelClassName?: string;
  name: string;
}

const disableClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export function InputRadio(props: InputRadioProps) {
  const { append, appendClassName, children, className, id, inputClassName, labelClassName, ...restProps } = props;
  const inputLabelId = `input-radio-${id}-label`;
  const inputRadioId = `input-radio-${id}`;
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="radio"
          id={inputRadioId}
          aria-labelledby={inputLabelId}
          className={cn('h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500', restProps.disabled && disableClassName, inputClassName)}
          data-testid="input-radio"
          {...restProps}
        />
        <label id={inputLabelId} htmlFor={inputRadioId} className={cn('ml-3 block leading-6', restProps.disabled && disableClassName, labelClassName)}>
          {children}
        </label>
      </div>
      {append && <div className={cn('ml-7 mt-4', appendClassName)}>{append}</div>}
    </div>
  );
}

import type { ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputRadioProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  children: ReactNode;
  id: string;
  name: string;
}

const disableClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export function InputRadio(props: InputRadioProps) {
  const { children, className, id, ...restProps } = props;
  const inputLabelId = `input-radio-${id}-label`;
  const inputRadioId = `input-radio-${id}`;
  return (
    <div className={'flex items-center'}>
      <input
        type="radio"
        id={inputRadioId}
        aria-labelledby={inputLabelId}
        className={cn('h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500', restProps.disabled && disableClassName, className)}
        data-testid="input-radio"
        {...restProps}
      />
      <label id={inputLabelId} htmlFor={inputRadioId} className={cn('ml-3 block font-medium leading-6', restProps.disabled && disableClassName)}>
        {children}
      </label>
    </div>
  );
}

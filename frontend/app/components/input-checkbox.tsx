import type { ReactNode } from 'react';

import { cn } from '~/utils/tw-utils';

export interface InputCheckboxProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  children: ReactNode;
  id: string;
  name: string;
}

const disableClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export function InputCheckbox(props: InputCheckboxProps) {
  const { children, className, id, ...restProps } = props;
  const inputLabelId = `input-checkbox-${id}-label`;
  const inputCheckboxId = `input-checkbox-${id}`;
  return (
    <div className={'flex items-center'}>
      <input
        type="checkbox"
        id={inputCheckboxId}
        aria-labelledby={inputLabelId}
        className={cn('h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500', restProps.disabled && disableClassName, className)}
        data-testid="input-checkbox"
        {...restProps}
      />
      <label id={inputLabelId} htmlFor={inputCheckboxId} className={cn('ml-3 block leading-6', restProps.disabled && disableClassName)}>
        {children}
      </label>
    </div>
  );
}

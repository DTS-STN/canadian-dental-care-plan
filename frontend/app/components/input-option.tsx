import type { ComponentProps, ReactNode } from 'react';

export interface InputOptionProps extends ComponentProps<'option'> {
  children: ReactNode;
  value: string | number;
}

export function InputOption(props: InputOptionProps) {
  const { children, ...restProps } = props;
  return (
    <option data-testid="input-option" {...restProps}>
      {children}
    </option>
  );
}

import { type ComponentProps } from 'react';

export interface InputOptionProps extends ComponentProps<'option'> {
  id: string;
  label: string;
  value: string;
}

export function InputOption(props: InputOptionProps) {
  const { label, value, id, ...restProps } = props;
  const inputOptionTestId = `input-option-${id}-test`;

  return (
    <option value={value} id={id} data-testid={inputOptionTestId} {...restProps}>
      {label}
    </option>
  );
}

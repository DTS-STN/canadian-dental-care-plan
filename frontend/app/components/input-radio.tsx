import { type ReactNode } from 'react';

export interface InputRadioProps extends Omit<React.ComponentProps<'input'>, 'aria-labelledby' | 'children' | 'type'> {
  children: ReactNode;
  id: string;
  name: string;
}

export function InputRadio(props: InputRadioProps) {
  const { children, id, ...restProps } = props;
  const inputLabelId = `input-radio-${id}-label`;
  const inputRadioId = `input-radio-${id}`;
  return (
    <>
      <input type="radio" id={inputRadioId} aria-labelledby={inputLabelId} data-testid="input-radio" {...restProps} />
      <label id={inputLabelId} htmlFor={inputRadioId}>
        {children}
      </label>
    </>
  );
}

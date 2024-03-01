import { forwardRef } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const disableClassName = 'disable:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';

export interface InputFieldProps extends Omit<React.ComponentProps<'input'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children'> {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  id: string;
  label: string;
  name: string;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>((props, ref) => {
  const { errorMessage, className, helpMessage, id, label, required, type = 'text', ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} required={required} className="mb-2">
        {label}
      </InputLabel>
      <input
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn('block rounded-lg bg-white focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-20', disableClassName, className)}
        data-testid="input-field"
        id={id}
        required={required}
        type={type}
        {...restInputProps}
      />
      {errorMessage && (
        <InputError id={inputErrorId} className="mt-2">
          {errorMessage}
        </InputError>
      )}
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid="input-field-help-secondary">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export { InputField };

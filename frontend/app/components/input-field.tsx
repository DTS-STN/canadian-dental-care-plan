import { forwardRef } from 'react';

import clsx from 'clsx';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from '~/components/input-label';

export interface InputFieldProps extends Omit<React.ComponentProps<'input'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children'> {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  helpMessageSecondary?: React.ReactNode;
  id: string;
  label: string;
  name: string;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>((props, ref) => {
  const { errorMessage, className, helpMessage, helpMessageSecondary, id, label, required, ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputHelpMessageSecondaryId = `input-${id}-help-secondary`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId} className="form-group">
      <InputLabel id={inputLabelId} htmlFor={id} required={required}>
        {label}
      </InputLabel>
      {errorMessage && (
        <InputError id={inputErrorId} className="mb-1.5">
          {errorMessage}
        </InputError>
      )}
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mb-1.5" data-testid="input-field-help">
          {helpMessage}
        </InputHelp>
      )}
      <input
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={clsx('form-control', className)}
        data-testid="input-field"
        id={id}
        required={required}
        {...restInputProps}
      />
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className="mt-1.5" data-testid="input-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export { InputField };

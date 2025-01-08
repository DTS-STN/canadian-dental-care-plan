import { forwardRef } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-500';
const inputDisabledClassName = 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputReadOnlyClassName = 'read-only:bg-gray-100 read-only:pointer-events-none read-only:cursor-not-allowed read-only:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputFieldProps extends OmitStrict<React.ComponentProps<'input'>, 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children'> {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  label: string;
  name: string;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>((props, ref) => {
  const { 'aria-describedby': ariaDescribedby, errorMessage, className, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, label, required, type = 'text', ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessagePrimaryId = `input-${id}-help-primary`;
  const inputHelpMessageSecondaryId = `input-${id}-help-secondary`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const describedby = [];
    if (ariaDescribedby) describedby.push(ariaDescribedby);
    if (helpMessagePrimary) describedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) describedby.push(inputHelpMessageSecondaryId);
    return describedby.length > 0 ? describedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      {errorMessage && (
        <p className="mb-2">
          <InputError id={inputErrorId}>{errorMessage}</InputError>
        </p>
      )}
      {helpMessagePrimary && (
        <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="input-field-help-primary">
          {helpMessagePrimary}
        </InputHelp>
      )}
      <input
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, inputReadOnlyClassName, errorMessage && inputErrorClassName, className)}
        data-testid="input-field"
        id={id}
        required={required}
        type={type}
        {...restInputProps}
      />
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="input-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export { InputField };

import { useState } from 'react';

import type { E164Number } from 'libphonenumber-js';
import PhoneInput from 'react-phone-number-input/input';

import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500';
const inputDisabledClassName = 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputReadOnlyClassName = 'read-only:bg-gray-100 read-only:pointer-events-none read-only:cursor-not-allowed read-only:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputPhoneFieldProps extends OmitStrict<React.ComponentProps<typeof PhoneInput>, 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children' | 'value'> {
  defaultValue?: string;
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  label: string;
  name: string;
}

export function InputPhoneField(props: InputPhoneFieldProps) {
  const { 'aria-describedby': ariaDescribedby, className, defaultValue, defaultCountry, errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, label, required, ...restProps } = props;
  const [value, setValue] = useState(defaultValue);

  const inputWrapperId = `input-phone-field-${id}`;
  const inputErrorId = `${inputWrapperId}-error`;
  const inputHelpMessagePrimaryId = `${inputWrapperId}-help-primary`;
  const inputHelpMessageSecondaryId = `${inputWrapperId}-help-secondary`;
  const inputLabelId = `${inputWrapperId}-label`;

  function getAriaDescribedby() {
    const describedby = [];
    if (ariaDescribedby) describedby.push(ariaDescribedby);
    if (helpMessagePrimary) describedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) describedby.push(inputHelpMessageSecondaryId);
    return describedby.length > 0 ? describedby.join(' ') : undefined;
  }

  function handleOnPhoneInputChange(value?: E164Number) {
    setValue(value);
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
        <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="input-phone-field-help-primary">
          {helpMessagePrimary}
        </InputHelp>
      )}
      <PhoneInput
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        data-testid="input-phone-field"
        defaultCountry={defaultCountry ?? 'CA'}
        id={id}
        className={cn(inputBaseClassName, inputDisabledClassName, inputReadOnlyClassName, errorMessage && inputErrorClassName, className)}
        onChange={handleOnPhoneInputChange}
        required={required}
        value={value}
        {...restProps}
      />
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="input-phone-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}

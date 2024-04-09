import { useState } from 'react';

import { E164Number } from 'libphonenumber-js';
import PhoneInput, { FeatureProps } from 'react-phone-number-input';
import enLabels from 'react-phone-number-input/locale/en';
import frLabels from 'react-phone-number-input/locale/fr';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-20';
const inputDisabledClassName = 'disable:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputPhoneFieldProps extends Omit<FeatureProps<React.InputHTMLAttributes<HTMLInputElement>>, 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children' | 'labels'> {
  defaultValue?: string;
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  label: string;
  locale?: string;
  name: string;
}

export function InputPhoneField(props: InputPhoneFieldProps) {
  const { 'aria-describedby': ariaDescribedby, className, defaultValue, errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, label, locale, required, ...restProps } = props;
  const [value, setValue] = useState(defaultValue ?? '');

  const inputWrapperId = `input-phone-field-${id}`;
  const inputErrorId = `${inputWrapperId}-error`;
  const inputHelpMessagePrimaryId = `${inputWrapperId}-help-primary`;
  const inputHelpMessageSecondaryId = `${inputWrapperId}-help-secondary`;
  const inputLabelId = `${inputWrapperId}-label`;

  function getAriaDescribedby() {
    const describedby = [];
    if (ariaDescribedby) describedby.push(ariaDescribedby);
    if (helpMessagePrimary) describedby.push(inputHelpMessagePrimaryId);
    if (helpMessagePrimary) describedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) describedby.push(inputHelpMessageSecondaryId);
    return describedby.length > 0 ? describedby.join(' ') : undefined;
  }

  const labels = locale === 'fr' ? frLabels : enLabels;

  function handleOnPhoneInputChange(value?: E164Number) {
    setValue(value ?? '');
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} required={required} className="mb-2">
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
        countryCallingCodeEditable={false}
        data-testid="input-phone-field"
        id={id}
        international
        labels={labels}
        numberInputProps={{ className: cn(inputBaseClassName, inputDisabledClassName, errorMessage && inputErrorClassName, className) }}
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

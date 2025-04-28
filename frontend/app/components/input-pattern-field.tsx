import { PatternFormat } from 'react-number-format';

import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

export interface InputPatternFieldProps extends OmitStrict<React.ComponentProps<typeof PatternFormat>, 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'value' | 'onChange'> {
  defaultValue: string;
  errorMessage?: string;
  format: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  label: string;
  name: string;
}

export function InputPatternField(props: InputPatternFieldProps) {
  const { 'aria-describedby': ariaDescribedby, className, defaultValue, errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, label, required, ...restProps } = props;

  const inputWrapperId = `input-pattern-field-${id}`;
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
        <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="input-pattern-field-help-primary">
          {helpMessagePrimary}
        </InputHelp>
      )}
      <PatternFormat
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        data-testid="input-pattern-field"
        id={id}
        className={cn(
          'block rounded-lg border-gray-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500 focus:outline-hidden', //
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70',
          'read-only:pointer-events-none read-only:cursor-not-allowed read-only:bg-gray-100 read-only:opacity-70',
          errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        required={required}
        value={defaultValue}
        {...restProps}
      />
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="input-pattern-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}

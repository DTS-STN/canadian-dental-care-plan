import type { ComponentProps, ReactNode } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputRadio } from './input-radio';

import { InputLegend } from '~/components/input-legend';
import { cn } from '~/utils/tw-utils';

export interface InputRadiosProps {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  options: OmitStrict<ComponentProps<typeof InputRadio>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'id' | 'name' | 'required'>[];
  legend: ReactNode;
  name: string;
  required?: boolean;
  legendClassName?: string;
}

const InputRadios = ({ errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, legend, name, options, required, legendClassName }: InputRadiosProps) => {
  const inputErrorId = `input-radios-${id}-error`;
  const inputHelpMessagePrimaryId = `input-radios-${id}-help-primary`;
  const inputHelpMessageSecondaryId = `input-radios-${id}-help-secondary`;
  const inputLegendId = `input-radios-${id}-legend`;
  const inputWrapperId = `input-radios-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessagePrimary) ariaDescribedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <fieldset id={inputWrapperId} data-testid={inputWrapperId} aria-labelledby={`${inputLegendId} ${inputHelpMessagePrimaryId}`} aria-required={required}>
      <InputLegend id={inputLegendId} className={cn('mb-2', legendClassName)} aria-describedby={getAriaDescribedby()}>
        {legend}
      </InputLegend>
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
      <ul className="space-y-2">
        {options.map((optionProps, index) => {
          const inputRadioId = `${id}-option-${index}`;
          return (
            <li key={inputRadioId}>
              <InputRadio aria-errormessage={errorMessage && inputErrorId} aria-invalid={!!errorMessage} hasError={!!errorMessage} id={inputRadioId} name={name} {...optionProps} />
            </li>
          );
        })}
      </ul>
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="input-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </fieldset>
  );
};

InputRadios.displayName = 'InputRadios';

export { InputRadios };

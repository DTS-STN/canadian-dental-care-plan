import type { ComponentProps, ReactNode } from 'react';

import { InputCheckbox } from '~/components/input-checkbox';
import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLegend } from '~/components/input-legend';
import { cn } from '~/utils/tw-utils';

export interface InputCheckboxesProps {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  options: OmitStrict<ComponentProps<typeof InputCheckbox>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'id' | 'name' | 'required'>[];
  legend: ReactNode;
  name: string;
  required?: boolean;
}

export function InputCheckboxes({ errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, legend, name, options, required }: InputCheckboxesProps) {
  const inputErrorId = `input-checkboxes-${id}-error`;
  const inputHelpMessagePrimaryId = `input-checkboxes-${id}-help-primary`;
  const inputHelpMessageSecondaryId = `input-checkboxes-${id}-help-secondary`;
  const inputLegendId = `input-checkboxes-${id}-legend`;
  const inputWrapperId = `input-checkboxes-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessagePrimary) ariaDescribedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <fieldset id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLegend id={inputLegendId} className="mb-2" aria-describedby={getAriaDescribedby()}>
        {legend}
        {helpMessagePrimary && (
          <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="input-field-help-primary">
            {helpMessagePrimary}
          </InputHelp>
        )}
      </InputLegend>
      {errorMessage && (
        <p className="mb-2">
          <InputError id={inputErrorId}>{errorMessage}</InputError>
        </p>
      )}
      <ul className="space-y-2">
        {options.map((optionProps, index) => {
          const inputCheckboxId = `${id}-option-${index}`;
          return (
            <li key={inputCheckboxId}>
              <InputCheckbox aria-errormessage={errorMessage && inputErrorId} aria-invalid={!!errorMessage} aria-required={required} hasError={!!errorMessage} id={inputCheckboxId} name={name} required={required} {...optionProps} />
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
}

InputCheckboxes.displayName = 'InputCheckboxes';

import type { ComponentProps, ReactNode } from 'react';

import { InputCheckbox } from '~/components/input-checkbox';
import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLegend } from '~/components/input-legend';

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

  const ariaDescribedbyIds =
    [
      !!helpMessagePrimary && inputHelpMessagePrimaryId, //
      !!helpMessageSecondary && inputHelpMessageSecondaryId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <fieldset id={inputWrapperId} className="space-y-2" aria-labelledby={inputLegendId} aria-describedby={ariaDescribedbyIds}>
      <InputLegend id={inputLegendId}>{legend}</InputLegend>
      {errorMessage && <InputError id={inputErrorId}>{errorMessage}</InputError>}
      {helpMessagePrimary && (
        <InputHelp id={inputHelpMessagePrimaryId} className={helpMessagePrimaryClassName}>
          {helpMessagePrimary}
        </InputHelp>
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
        <InputHelp id={inputHelpMessageSecondaryId} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </fieldset>
  );
}

InputCheckboxes.displayName = 'InputCheckboxes';

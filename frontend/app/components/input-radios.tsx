import type { ComponentProps, ReactNode } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputRadio } from './input-radio';

import { InputLegend } from '~/components/input-legend';

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
  outerAriaDescribedById?: string;
}

export function InputRadios({ errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, legend, name, options, required, legendClassName, outerAriaDescribedById }: InputRadiosProps) {
  const inputErrorId = `input-radios-${id}-error`;
  const inputHelpMessagePrimaryId = `input-radios-${id}-help-primary`;
  const inputHelpMessageSecondaryId = `input-radios-${id}-help-secondary`;
  const inputLegendId = `input-radios-${id}-legend`;
  const inputWrapperId = `input-radios-${id}`;

  const ariaDescribedbyIds =
    [
      !!helpMessagePrimary && inputHelpMessagePrimaryId, //
      !!helpMessageSecondary && inputHelpMessageSecondaryId,
      !!outerAriaDescribedById && outerAriaDescribedById,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <fieldset role="radiogroup" id={inputWrapperId} className="space-y-2" aria-labelledby={inputLegendId} aria-describedby={ariaDescribedbyIds} aria-required={required}>
      <InputLegend id={inputLegendId} className={legendClassName}>
        {legend}
      </InputLegend>
      {errorMessage && <InputError id={inputErrorId}>{errorMessage}</InputError>}
      {helpMessagePrimary && (
        <InputHelp id={inputHelpMessagePrimaryId} className={helpMessagePrimaryClassName}>
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
        <InputHelp id={inputHelpMessageSecondaryId} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </fieldset>
  );
}

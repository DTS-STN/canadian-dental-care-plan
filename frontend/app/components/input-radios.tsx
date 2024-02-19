import type { ComponentProps, ReactNode } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputRadio } from './input-radio';
import { InputLegend } from '~/components/input-legend';

export interface InputRadiosProps {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  id: string;
  options: Omit<ComponentProps<typeof InputRadio>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'id' | 'name' | 'required'>[];
  legend: ReactNode;
  name: string;
  required?: boolean;
}

const InputRadios = ({ errorMessage, helpMessage, id, legend, name, options, required }: InputRadiosProps) => {
  const inputErrorId = `input-radios-${id}-error`;
  const inputHelpMessageId = `input-radios-${id}-help`;
  const inputLegendId = `input-radios-${id}-legend`;
  const inputWrapperId = `input-radios-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [inputLegendId];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <fieldset id={inputWrapperId} data-testid={inputWrapperId} className="mb-6">
      <InputLegend id={inputLegendId} required={required} className="mb-2">
        {legend}
      </InputLegend>
      <ul className="space-y-2">
        {options.map((option, index) => {
          const inputRadioId = `${id}-option-${index}`;
          return (
            <li key={inputRadioId}>
              <InputRadio aria-describedby={getAriaDescribedby()} aria-errormessage={errorMessage && inputErrorId} aria-invalid={!!errorMessage} aria-required={required} id={inputRadioId} name={name} required={required} {...option} />
            </li>
          );
        })}
      </ul>
      {errorMessage && (
        <InputError id={inputErrorId} className="mt-2">
          {errorMessage}
        </InputError>
      )}
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid="input-field-help">
          {helpMessage}
        </InputHelp>
      )}
    </fieldset>
  );
};

InputRadios.displayName = 'InputRadios';

export { InputRadios };

import type { ComponentProps, ReactNode } from 'react';

import { InputError } from './input-error';
import { InputRadio } from './input-radio';
import { InputLegend } from '~/components/input-legend';

export interface InputRadiosProps {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  helpMessageSecondary?: React.ReactNode;
  id: string;
  options: Omit<ComponentProps<typeof InputRadio>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'id' | 'name' | 'required'>[];
  legend: ReactNode;
  name: string;
  required?: boolean;
}

const InputRadios = ({ errorMessage, helpMessage, helpMessageSecondary, id, legend, name, options, required }: InputRadiosProps) => {
  const inputErrorId = `input-radios-${id}-error`;
  const inputHelpMessageId = `input-radios-${id}-help`;
  const inputHelpMessageSecondaryId = `input-radios-${id}-help-secondary`;
  const inputLegendId = `input-radios-${id}-legend`;
  const inputWrapperId = `input-radios-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [inputLegendId];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <fieldset id={inputWrapperId} data-testid={inputWrapperId} className="gc-chckbxrdio">
      <InputLegend id={inputLegendId} required={required}>
        {legend}
      </InputLegend>
      {errorMessage && (
        <InputError id={inputErrorId} className="mb-1.5">
          {errorMessage}
        </InputError>
      )}
      <ul className="list-unstyled lst-spcd-2">
        {options?.map((option, index) => {
          const inputRadioId = `${id}-option-${index}`;
          return (
            <li key={inputRadioId} className="radio">
              <InputRadio aria-describedby={getAriaDescribedby()} aria-errormessage={errorMessage ? inputErrorId : undefined} aria-invalid={!!errorMessage} aria-required={required} id={inputRadioId} name={name} required={required} {...option} />
            </li>
          );
        })}
      </ul>
      {helpMessage && (
        <span className="mb-1.5 block max-w-prose text-base text-gray-600" id={inputHelpMessageId} data-testid="input-field-help">
          {helpMessage}
        </span>
      )}
      {helpMessageSecondary && (
        <span className="mt-1.5 block max-w-prose text-base text-gray-600" id={inputHelpMessageSecondaryId} data-testid="input-field-help-secondary">
          {helpMessageSecondary}
        </span>
      )}
    </fieldset>
  );
};

InputRadios.displayName = 'InputRadios';

export { InputRadios };

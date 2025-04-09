import type { ComponentProps, ReactNode } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from './input-label';
import { InputOption } from './input-option';

import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500';
const inputDisabledClassName = 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputSelectProps extends OmitStrict<ComponentProps<'select'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
  errorMessage?: string;
  helpMessage?: ReactNode;
  id: string;
  label: string;
  name: string;
  options: OmitStrict<ComponentProps<typeof InputOption>, 'id'>[];
}

export function InputSelect(props: InputSelectProps) {
  const { errorMessage, helpMessage, id, label, options, className, required, ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputLabelId = `input-${id}-label`;
  const inputTestId = `input-${id}-test`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
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
      <select
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, errorMessage && inputErrorClassName, className)}
        data-testid={inputTestId}
        id={id}
        required={required}
        {...restInputProps}
      >
        {options.map((optionProps, index) => {
          const inputOptionId = `${id}-select-option-${index}`;
          return <InputOption id={inputOptionId} key={optionProps.value} {...optionProps} />;
        })}
      </select>
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid="input-select-help">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
}

import { type ComponentProps, type ReactNode, forwardRef } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from './input-label';
import { InputOption } from './input-option';
import { cn } from '~/utils/tw-utils';

const disableClassName = 'disable:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';

export interface InputSelectProps extends Omit<ComponentProps<'select'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
  errorMessage?: string;
  helpMessage?: ReactNode;
  id: string;
  label: string;
  name: string;
  options: Omit<ComponentProps<typeof InputOption>, 'id'>[];
}

const InputSelect = forwardRef<HTMLSelectElement, InputSelectProps>((props, ref) => {
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
    <div id={inputWrapperId} data-testid={inputWrapperId} className="mb-6">
      <InputLabel id={inputLabelId} htmlFor={id} required={required} className="mb-2">
        {label}
      </InputLabel>
      <select
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn('block rounded-lg bg-white focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-20', disableClassName, className)}
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
      {errorMessage && (
        <InputError id={inputErrorId} className="mt-2">
          {errorMessage}
        </InputError>
      )}
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid="input-select-help">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
});

InputSelect.displayName = 'InputSelect';

export { InputSelect };

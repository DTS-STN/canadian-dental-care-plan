import { type ComponentProps, type ReactNode, forwardRef } from 'react';

import clsx from 'clsx';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from './input-label';
import { InputOption } from './input-option';

export interface InputSelectProps extends Omit<ComponentProps<'select'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
  errorMessage?: string;
  helpMessage?: ReactNode;
  helpMessageSecondary?: ReactNode;
  id: string;
  label: string;
  name: string;
  options: ComponentProps<typeof InputOption>[];
}

const InputSelect = forwardRef<HTMLSelectElement, InputSelectProps>((props, ref) => {
  const { errorMessage, helpMessage, helpMessageSecondary, id, label, options, className, required, ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputHelpMessageSecondaryId = `input-${id}-help-secondary`;
  const inputLabelId = `input-${id}-label`;
  const inputTestId = `input-${id}-test`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId} className="form-group">
      <InputLabel id={inputLabelId} htmlFor={id} required={required}>
        {label}
      </InputLabel>
      {errorMessage && (
        <InputError id={inputErrorId} className="mb-1.5">
          {errorMessage}
        </InputError>
      )}
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mb-1.5" data-testid="input-select-help">
          {helpMessage}
        </InputHelp>
      )}
      <select
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={clsx('form-control', className)}
        data-testid={inputTestId}
        id={id}
        required={required}
        {...restInputProps}
      >
        {options.map(({ value, ...restProps }) => (
          <InputOption value={value} key={value} {...restProps} />
        ))}
      </select>
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className="mt-1.5" data-testid="input-textarea-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
});

InputSelect.displayName = 'InputSelect';

export { InputSelect };

import { forwardRef } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500';
const inputDisabledClassName = 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputReadOnlyClassName = 'read-only:bg-gray-100 read-only:pointer-events-none read-only:cursor-not-allowed read-only:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputTextareaProps extends OmitStrict<React.ComponentProps<'textarea'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  id: string;
  label: string;
  name: string;
}

const InputTextarea = forwardRef<HTMLTextAreaElement, InputTextareaProps>((props, ref) => {
  const { errorMessage, className, helpMessage, id, label, required, rows, ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId} className="form-group">
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      {errorMessage && (
        <div className="mb-2">
          <InputError id={inputErrorId}>{errorMessage}</InputError>
        </div>
      )}
      <textarea
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, inputReadOnlyClassName, inputReadOnlyClassName, errorMessage && inputErrorClassName, className)}
        data-testid="input-textarea"
        id={id}
        required={required}
        rows={rows ?? 3}
        {...restInputProps}
      />
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid="input-textarea-help">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
});

InputTextarea.displayName = 'InputTextarea';

export { InputTextarea };

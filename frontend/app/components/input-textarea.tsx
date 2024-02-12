import { forwardRef } from 'react';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

const disableClassName = 'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';

export interface InputTextareaProps extends Omit<React.ComponentProps<'textarea'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
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
      <InputLabel id={inputLabelId} htmlFor={id} required={required} className="mb-2">
        {label}
      </InputLabel>
      <textarea
        ref={ref}
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn('block rounded-lg focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-20', disableClassName, className)}
        data-testid="input-textarea"
        id={id}
        required={required}
        rows={rows ?? 3}
        {...restInputProps}
      />
      {errorMessage && (
        <InputError id={inputErrorId} className="mt-2">
          {errorMessage}
        </InputError>
      )}
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

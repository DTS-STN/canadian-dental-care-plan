import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tw-utils';

export interface InputTextareaProps extends OmitStrict<React.ComponentProps<'textarea'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'> {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  id: string;
  label: string;
  name: string;
}

export function InputTextarea(props: InputTextareaProps) {
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
    <div id={inputWrapperId} className="form-group">
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      {errorMessage && (
        <InputError id={inputErrorId} className="mb-2">
          {errorMessage}
        </InputError>
      )}
      <textarea
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(
          'block rounded-lg border-gray-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500 focus:outline-hidden', //
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70',
          'read-only:pointer-events-none read-only:cursor-not-allowed read-only:bg-gray-100 read-only:opacity-70',
          errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        id={id}
        required={required}
        rows={rows ?? 3}
        {...restInputProps}
      />
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2">
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
}

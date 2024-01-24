import clsx from 'clsx';

import { InputLabel } from '~/components/input-label';

export interface InputFieldProps extends Omit<React.ComponentProps<'input'>, 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'children'> {
  errorMessage?: string;
  helpMessage?: React.ReactNode;
  helpMessageSecondary?: React.ReactNode;
  id: string;
  label: string;
  name: string;
  type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

export const InputField = (props: InputFieldProps) => {
  const { errorMessage, className, helpMessage, helpMessageSecondary, id, label, required, ...restInputProps } = props;

  const inputHelpMessageId = `input-${id}-help`;
  const inputHelpMessageSecondaryId = `input-${id}-help-secondary`;
  const inputLabelErrorId = `input-${id}-error`;
  const inputLabelId = `input-${id}-label`;
  const inputWrapperId = `input-${id}`;

  function getAriaDescribedby() {
    const ariaDescribedby = [];
    if (helpMessage) ariaDescribedby.push(inputHelpMessageId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.length > 0 ? ariaDescribedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId} className="form-group">
      <InputLabel id={inputLabelId} errorId={inputLabelErrorId} data-testid={inputLabelId} htmlFor={id} required={required} errorMessage={errorMessage}>
        {label}
      </InputLabel>
      {helpMessage && (
        <div className="mb-1.5 max-w-prose text-base text-gray-600" id={inputHelpMessageId} data-testid={inputHelpMessageId}>
          {helpMessage}
        </div>
      )}
      <input
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputLabelErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={clsx('form-control', className)}
        data-testid={`data-test-${id}`}
        id={id}
        required={required}
        {...restInputProps}
      />
      {helpMessageSecondary && (
        <div className="mt-1.5 max-w-prose text-base text-gray-600" id={inputHelpMessageSecondaryId} data-testid={inputHelpMessageSecondaryId}>
          {helpMessageSecondary}
        </div>
      )}
    </div>
  );
};

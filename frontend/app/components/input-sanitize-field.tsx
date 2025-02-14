import { NumberFormatBase } from 'react-number-format';

import { InputError } from './input-error';
import { InputHelp } from './input-help';

import { InputLabel } from '~/components/input-label';
import { isAllValidInputCharacters, normalizeHyphens, removeInvalidInputCharacters } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500';
const inputDisabledClassName = 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputReadOnlyClassName = 'read-only:bg-gray-100 read-only:pointer-events-none read-only:cursor-not-allowed read-only:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputSanitizeFieldProps
  extends OmitStrict<React.ComponentProps<typeof NumberFormatBase>, 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required' | 'format' | 'type' | 'removeFormatting' | 'isValidInputCharacter' | 'getCaretBoundary'> {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  label: string;
  name: string;
  disableErrorSR?: boolean;
}

export function InputSanitizeField(props: InputSanitizeFieldProps) {
  const { 'aria-describedby': ariaDescribedby, className, errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, label, required, disableErrorSR, ...restProps } = props;

  const inputWrapperId = `input-sanitize-field-${id}`;
  const inputErrorId = `${inputWrapperId}-error`;
  const inputHelpMessagePrimaryId = `${inputWrapperId}-help-primary`;
  const inputHelpMessageSecondaryId = `${inputWrapperId}-help-secondary`;
  const inputLabelId = `${inputWrapperId}-label`;

  function getAriaDescribedby() {
    const describedby = [];
    if (ariaDescribedby) describedby.push(ariaDescribedby);
    if (helpMessagePrimary) describedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) describedby.push(inputHelpMessageSecondaryId);
    return describedby.length > 0 ? describedby.join(' ') : undefined;
  }

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      {errorMessage && (
        <p className="mb-2">
          <InputError aria-hidden={disableErrorSR} id={inputErrorId}>
            {errorMessage}
          </InputError>
        </p>
      )}
      {helpMessagePrimary && (
        <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="input-sanitize-field-help-primary">
          {helpMessagePrimary}
        </InputHelp>
      )}
      <NumberFormatBase
        aria-describedby={getAriaDescribedby()}
        aria-errormessage={errorMessage ? inputErrorId : undefined}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        data-testid="input-sanitize-field"
        id={id}
        className={cn(inputBaseClassName, inputDisabledClassName, inputReadOnlyClassName, errorMessage && inputErrorClassName, className)}
        required={required}
        {...restProps}
        type="text"
        inputMode="text"
        format={(value) => normalizeHyphens(removeInvalidInputCharacters(value))}
        removeFormatting={(value) => normalizeHyphens(removeInvalidInputCharacters(value))}
        isValidInputCharacter={(char) => isAllValidInputCharacters(char)}
        getCaretBoundary={(value) =>
          Array(value.length + 1)
            .fill(0)
            .map((v) => true)
        }
      />
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="input-sanitize-field-help-secondary">
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}

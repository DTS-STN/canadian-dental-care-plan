import type { ReactNode } from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from './input-label';
import { InputLegend } from './input-legend';
import { InputOption } from './input-option';

import { useCurrentLanguage } from '~/hooks';
import { extractDateParts, useMonths } from '~/utils/date-utils';
import { padWithZero } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

const inputBaseStyles = 'block rounded-lg border-gray-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500 focus:outline-hidden';
const inputDisabledStyles = 'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70';
const inputErrorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface DatePickerFieldProps {
  defaultValue: string;
  disabled?: boolean;
  errorMessages?: {
    all?: string;
    day?: string;
    month?: string;
    year?: string;
  };
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  legend: ReactNode;
  names: {
    day: string;
    month: string;
    year: string;
  };
  required?: boolean;
}

export const DatePickerField = ({ defaultValue, disabled, errorMessages, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, legend, names, required }: DatePickerFieldProps) => {
  const { currentLanguage } = useCurrentLanguage();
  const { t } = useTranslation(['gcweb']);
  const [value] = useState(extractDateParts(defaultValue));

  const inputWrapperId = `date-picker-${id}`;
  const inputErrorId = `${inputWrapperId}-error`;
  const inputErrorIdAll = `${inputErrorId}-all`;
  const inputErrorIdMonth = `${inputErrorId}-month`;
  const inputErrorIdDay = `${inputErrorId}-day`;
  const inputErrorIdYear = `${inputErrorId}-year`;
  const inputHelpMessagePrimaryId = `${inputWrapperId}-help-primary`;
  const inputHelpMessageSecondaryId = `${inputWrapperId}-help-secondary`;
  const inputLegendId = `${inputWrapperId}-legend`;

  const ariaDescribedbyIds =
    [
      !!helpMessagePrimary && inputHelpMessagePrimaryId, //
      !!helpMessageSecondary && inputHelpMessageSecondaryId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const ariaErrorMessageYear =
    [
      !!errorMessages?.all && inputErrorIdAll, //
      !!errorMessages?.year && inputErrorIdYear,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const datePickerYear = (
    <DatePickerYear
      id={id} //
      defaultValue={value.year ?? ''}
      name={names.year}
      label={t('gcweb:date-picker.year.label')}
      className="w-full sm:w-32"
      ariaErrorMessage={ariaErrorMessageYear}
      required={required}
      disabled={disabled}
    />
  );

  const ariaErrorMessageMonth =
    [
      !!errorMessages?.all && inputErrorIdAll, //
      !!errorMessages?.month && inputErrorIdMonth,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const datePickerMonth = (
    <DatePickerMonth
      id={id} //
      defaultValue={value.month ?? ''}
      name={names.month}
      label={t('gcweb:date-picker.month.label')}
      placeholder={t('gcweb:date-picker.month.placeholder')}
      className="w-full sm:w-auto"
      ariaErrorMessage={ariaErrorMessageMonth}
      required={required}
      disabled={disabled}
    />
  );

  const ariaErrorMessageDay =
    [
      !!errorMessages?.all && inputErrorIdAll, //
      !!errorMessages?.day && inputErrorIdDay,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const datePickerDay = (
    <DatePickerDay
      id={id} //
      defaultValue={value.day ?? ''}
      name={names.day}
      label={t('gcweb:date-picker.day.label')}
      className="w-full sm:w-20"
      ariaErrorMessage={ariaErrorMessageDay}
      required={required}
      disabled={disabled}
    />
  );

  const datePickerErrorMessages = {
    all: typeof errorMessages?.all === 'string' ? <InputError id={inputErrorIdAll}>{errorMessages.all}</InputError> : undefined,
    month: typeof errorMessages?.month === 'string' ? <InputError id={inputErrorIdMonth}>{errorMessages.month}</InputError> : undefined,
    day: typeof errorMessages?.day === 'string' ? <InputError id={inputErrorIdDay}>{errorMessages.day}</InputError> : undefined,
    year: typeof errorMessages?.year === 'string' ? <InputError id={inputErrorIdYear}>{errorMessages.year}</InputError> : undefined,
  };

  return (
    <fieldset id={inputWrapperId} aria-labelledby={inputLegendId} aria-describedby={ariaDescribedbyIds}>
      <InputLegend id={inputLegendId} className="mb-2">
        {legend}
      </InputLegend>
      {(datePickerErrorMessages.all !== undefined || datePickerErrorMessages.year !== undefined || datePickerErrorMessages.month !== undefined || datePickerErrorMessages.day !== undefined) && (
        <div className="mb-2 space-y-2">
          {datePickerErrorMessages.all && <p>{datePickerErrorMessages.all}</p>}
          {currentLanguage === 'fr' ? (
            <>
              {datePickerErrorMessages.day}
              {datePickerErrorMessages.month}
              {datePickerErrorMessages.year}
            </>
          ) : (
            <>
              {datePickerErrorMessages.month}
              {datePickerErrorMessages.day}
              {datePickerErrorMessages.year}
            </>
          )}
        </div>
      )}
      {helpMessagePrimary && (
        <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)}>
          {helpMessagePrimary}
        </InputHelp>
      )}
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        {currentLanguage === 'fr' ? (
          <>
            {datePickerDay}
            {datePickerMonth}
            {datePickerYear}
          </>
        ) : (
          <>
            {datePickerMonth}
            {datePickerDay}
            {datePickerYear}
          </>
        )}
      </div>
      {helpMessageSecondary && (
        <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </fieldset>
  );
};

interface DatePickerMonthProps {
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}

function DatePickerMonth({ ariaErrorMessage, className, defaultValue, disabled, id, label, name, placeholder, required }: DatePickerMonthProps) {
  const { currentLanguage } = useCurrentLanguage();
  const months = useMonths(currentLanguage);

  const selectId = `date-picker-${id}-month`;
  const wrapperId = `date-picker-${id}-month-wrapper`;
  const inputLabelId = `date-picker-${id}-month-label`;
  const inputOptionUnselectedId = `date-picker-${id}-month-option-unselected`;

  return (
    <div id={wrapperId}>
      <InputLabel id={inputLabelId} htmlFor={selectId} className="mb-2">
        {label}
      </InputLabel>
      <select
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseStyles, inputDisabledStyles, ariaErrorMessage && inputErrorStyles, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={selectId}
        name={name}
        required={required}
      >
        <InputOption id={inputOptionUnselectedId} value="" disabled hidden>
          {placeholder}
        </InputOption>
        {months.map((month) => {
          return (
            <InputOption id={`date-picker-${id}-month-option-${month.index}`} key={month.index} value={padWithZero(month.index, 2)}>
              {month.text}
            </InputOption>
          );
        })}
      </select>
    </div>
  );
}

interface DatePickerYearProps {
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean;
}

function DatePickerYear({ ariaErrorMessage, className, defaultValue, disabled, id, label, name, required }: DatePickerYearProps) {
  const inputId = `date-picker-${id}-year`;
  const wrapperId = `date-picker-${id}-year-wrapper`;
  const inputLabelId = `date-picker-${id}-year-label`;

  return (
    <div id={wrapperId}>
      <InputLabel id={inputLabelId} htmlFor={inputId} className="mb-2">
        {label}
      </InputLabel>
      <input
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseStyles, inputDisabledStyles, ariaErrorMessage && inputErrorStyles, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={inputId}
        min={1900}
        name={name}
        required={required}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
      />
    </div>
  );
}

interface DatePickerDayProps {
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean;
}

function DatePickerDay({ ariaErrorMessage, className, defaultValue, disabled, id, label, name, required }: DatePickerDayProps) {
  const inputId = `date-picker-${id}-day`;
  const wrapperId = `date-picker-${id}-day-wrapper`;
  const inputLabelId = `date-picker-${id}-day-label`;

  return (
    <div id={wrapperId}>
      <InputLabel id={inputLabelId} htmlFor={inputId} className="mb-2">
        {label}
      </InputLabel>
      <input
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseStyles, inputDisabledStyles, ariaErrorMessage && inputErrorStyles, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={inputId}
        max={31}
        min={1}
        name={name}
        required={required}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
      />
    </div>
  );
}

import { ChangeEvent, ReactNode, useCallback, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { InputError } from './input-error';
import { InputHelp } from './input-help';
import { InputLabel } from './input-label';
import { InputLegend } from './input-legend';
import { InputOption } from './input-option';
import { parseDateString, useMonths } from '~/utils/date-utils';
import { padWithZero } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

const inputBaseClassName = 'block rounded-lg bg-white focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-20';
const inputDisabledClassName = 'disable:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputErrorClassName = 'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500';

function toDateStringOrEmpty({ year, month, day }: { year?: string; month?: string; day?: string }) {
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
}

export interface DatePickerFieldProps {
  defaultValue: string;
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  legend: ReactNode;
  name: string;
  required?: boolean;
}

export const DatePickerField = ({ defaultValue, errorMessage, helpMessagePrimary, helpMessagePrimaryClassName, helpMessageSecondary, helpMessageSecondaryClassName, id, legend, name, required }: DatePickerFieldProps) => {
  const { i18n, t } = useTranslation(['gcweb']);
  const [value, setValue] = useState(parseDateString(defaultValue));

  const inputErrorId = `date-picker-${id}-error`;
  const inputHelpMessagePrimaryId = `date-picker-${id}-help-primary`;
  const inputHelpMessageSecondaryId = `date-picker-${id}-help-secondary`;
  const inputLegendId = `date-picker-${id}-legend`;
  const inputWrapperId = `date-picker-${id}`;

  const getAriaDescribedBy = useCallback(() => {
    const ariaDescribedby = [inputLegendId];
    if (helpMessagePrimary) ariaDescribedby.push(inputHelpMessagePrimaryId);
    if (helpMessageSecondary) ariaDescribedby.push(inputHelpMessageSecondaryId);
    return ariaDescribedby.join(' ');
  }, [helpMessagePrimary, helpMessageSecondary, inputHelpMessagePrimaryId, inputHelpMessageSecondaryId, inputLegendId]);

  const handleOnYearChange = useCallback((val: string) => {
    setValue((prev) => ({ ...prev, year: val }));
  }, []);

  const handleOnMonthChange = useCallback((val: string) => {
    setValue((prev) => ({ ...prev, month: val }));
  }, []);

  const handleOnDayChange = useCallback((val: string) => {
    setValue((prev) => ({ ...prev, day: val }));
  }, []);

  const datePickerYear = useMemo(
    () => (
      <DatePickerYear
        id={id}
        defaultValue={value.year ?? ''}
        onChange={handleOnYearChange}
        label={t('gcweb:date-picker.year.label')}
        placeholder={t('gcweb:date-picker.year.placeholder')}
        className="w-full sm:w-32"
        ariaDescribedBy={getAriaDescribedBy()}
        ariaErrorMessage={errorMessage && inputErrorId}
      />
    ),
    [errorMessage, getAriaDescribedBy, handleOnYearChange, id, inputErrorId, t, value.year],
  );
  const datePickerMonth = useMemo(
    () => (
      <DatePickerMonth
        id={id}
        defaultValue={value.month ?? ''}
        onChange={handleOnMonthChange}
        label={t('gcweb:date-picker.month.label')}
        placeholder={t('gcweb:date-picker.month.placeholder')}
        className="w-full sm:w-auto"
        ariaDescribedBy={getAriaDescribedBy()}
        ariaErrorMessage={errorMessage && inputErrorId}
      />
    ),
    [errorMessage, getAriaDescribedBy, handleOnMonthChange, id, inputErrorId, t, value.month],
  );

  const datePickerDay = useMemo(
    () => (
      <DatePickerDay
        id={id}
        defaultValue={value.day ?? ''}
        onChange={handleOnDayChange}
        label={t('gcweb:date-picker.day.label')}
        placeholder={t('gcweb:date-picker.day.placeholder')}
        className="w-full sm:w-20"
        ariaDescribedBy={getAriaDescribedBy()}
        ariaErrorMessage={errorMessage && inputErrorId}
      />
    ),
    [errorMessage, getAriaDescribedBy, handleOnDayChange, id, inputErrorId, t, value.day],
  );

  function getHiddenValue() {
    const inputsValue = toDateStringOrEmpty(value);
    const parsedDate = parseDateString(inputsValue);
    return toDateStringOrEmpty(parsedDate);
  }

  return (
    <div id={inputWrapperId} data-testid="date-picker-field">
      <fieldset>
        <input type="hidden" id={id} name={name} value={getHiddenValue()} />
        <InputLegend id={inputLegendId} required={required} className="mb-2">
          {legend}
        </InputLegend>
        {helpMessagePrimary && (
          <InputHelp id={inputHelpMessagePrimaryId} className={cn('mb-2', helpMessagePrimaryClassName)} data-testid="date-picker-help-primary">
            {helpMessagePrimary}
          </InputHelp>
        )}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          {i18n.language === 'fr' ? (
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
        {errorMessage && (
          <InputError id={inputErrorId} className="mt-2" data-testid="date-picker-error">
            {errorMessage}
          </InputError>
        )}
        {helpMessageSecondary && (
          <InputHelp id={inputHelpMessageSecondaryId} className={cn('mt-2', helpMessageSecondaryClassName)} data-testid="date-picker-help-secondary">
            {helpMessageSecondary}
          </InputHelp>
        )}
      </fieldset>
    </div>
  );
};

interface DatePickerMonthProps {
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function DatePickerMonth({ ariaDescribedBy, ariaErrorMessage, className, defaultValue, id, label, onChange, placeholder, required }: DatePickerMonthProps) {
  const { i18n } = useTranslation(['gcweb']);
  const months = useMonths(i18n.language);

  const selectId = `date-picker-${id}-month`;
  const wrapperId = `date-picker-${id}-month-wrapper`;
  const inputLabelId = `date-picker-${id}-month-label`;
  const inputOptionUnselectedId = `date-picker-${id}-month-option-unselected`;

  function handleOnChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <div id={wrapperId} data-testid="date-picker-month">
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      <select
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, ariaErrorMessage && inputErrorClassName, className)}
        data-testid="date-picker-month-select"
        defaultValue={defaultValue}
        id={selectId}
        onChange={handleOnChange}
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
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function DatePickerYear({ ariaDescribedBy, ariaErrorMessage, className, defaultValue, id, label, onChange, placeholder, required }: DatePickerYearProps) {
  const inputId = `date-picker-${id}-year`;
  const wrapperId = `date-picker-${id}-year-wrapper`;
  const inputLabelId = `date-picker-${id}-year-label`;

  function handleOnChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div id={wrapperId} data-testid="date-picker-year">
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      <input
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, ariaErrorMessage && inputErrorClassName, className)}
        data-testid="date-picker-year-input"
        defaultValue={defaultValue}
        id={inputId}
        min={1900}
        onChange={handleOnChange}
        placeholder={placeholder}
        required={required}
        type="number"
      />
    </div>
  );
}

interface DatePickerDayProps {
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function DatePickerDay({ ariaDescribedBy, ariaErrorMessage, className, defaultValue, id, label, onChange, placeholder, required }: DatePickerDayProps) {
  const inputId = `date-picker-${id}-day`;
  const wrapperId = `date-picker-${id}-day-wrapper`;
  const inputLabelId = `date-picker-${id}-day-label`;

  function handleOnChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div id={wrapperId} data-testid="date-picker-day">
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2">
        {label}
      </InputLabel>
      <input
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={!!ariaErrorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, ariaErrorMessage && inputErrorClassName, className)}
        data-testid="date-picker-day-input"
        defaultValue={defaultValue}
        id={inputId}
        max={31}
        min={1}
        onChange={handleOnChange}
        placeholder={placeholder}
        required={required}
        type="number"
      />
    </div>
  );
}

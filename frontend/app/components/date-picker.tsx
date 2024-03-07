import { InputField } from './input-field';
import { InputSelect } from './input-select';

export interface DateOfBirthProps {
  id: string;
  lang: string;
  legend: string;
  monthLabel: string;
  dayLabel: string;
  yearLabel: string;
  monthDefault?: number;
  dayDefault?: number;
  yearDefault?: number;
  errorMessageMonth?: string;
  errorMessageDay?: string;
  errorMessageYear?: string;
}

export function DatePicker(props: DateOfBirthProps) {
  const { id, lang = 'en', legend, monthLabel, dayLabel, yearLabel, monthDefault, dayDefault, yearDefault, errorMessageMonth, errorMessageDay, errorMessageYear } = props;
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ children: new Intl.DateTimeFormat(`${lang}-ca`, { month: 'long' }).format(new Date(1900, i, 1)), value: i, id: `month-${i}` }));

  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-col gap-6 sm:flex-row">
        {lang === 'fr' && (
          <>
            <InputField id={`${id}-day`} label={dayLabel} name={`${id}-day`} inputMode="numeric" min={1} max={31} defaultValue={dayDefault} errorMessage={errorMessageDay} />
            <InputSelect id={`${id}-month`} label={monthLabel} options={monthOptions} name={`${id}-month`} defaultValue={monthDefault} errorMessage={errorMessageMonth} />
          </>
        )}
        {lang === 'en' && (
          <>
            <InputSelect id={`${id}-month`} label={monthLabel} options={monthOptions} name={`${id}-month`} defaultValue={monthDefault} errorMessage={errorMessageMonth} />
            <InputField id={`${id}-day`} label={dayLabel} name={`${id}-day`} inputMode="numeric" min={1} max={31} defaultValue={dayDefault} errorMessage={errorMessageDay} />
          </>
        )}
        <InputField id={`${id}-year`} label={yearLabel} name={`${id}-year`} inputMode="numeric" min={1900} defaultValue={yearDefault} errorMessage={errorMessageYear} />
      </div>
    </fieldset>
  );
}

import type { ReadonlyDeep } from 'type-fest';

export type ApplicationYearRequestEntity = Readonly<{
  currentDate: string;
}>;

export type ApplicationYearResultEntity = ReadonlyDeep<{
  ApplicationYearCollection: Array<{
    TaxYear?: string;
    ApplicationYearID?: string;
  }>;
}>;

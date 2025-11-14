import type { ReadonlyDeep } from 'type-fest';

export type CoverageDto = ReadonlyDeep<{
  endDate: string;
  startDate: string;
  taxationYear: number;
  year: number;
}>;

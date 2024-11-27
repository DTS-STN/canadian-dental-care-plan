export type ApplicationYearRequestEntity = Readonly<{
  currentDate: string;
}>;

export type ApplicationYearResultEntity = Readonly<{
  ApplicationYearCollection: ReadonlyArray<{
    TaxYear?: string;
    ApplicationYearID?: string;
  }>;
}>;

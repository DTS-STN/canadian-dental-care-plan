export type ApplicationYearRequestEntity = Readonly<{
  date: string;
}>;

export type ApplicationYearResultEntity = Readonly<{
  ApplicationYearCollection: ReadonlyArray<{
    TaxYear?: string;
    ApplicationYearID?: string;
  }>;
}>;

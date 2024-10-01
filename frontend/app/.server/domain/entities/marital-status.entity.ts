export type MaritalStatusEntity = Readonly<{
  Value: number;
  Label: Readonly<{
    LocalizedLabels: ReadonlyArray<
      Readonly<{
        LanguageCode: number;
        Label: string;
      }>
    >;
  }>;
}>;

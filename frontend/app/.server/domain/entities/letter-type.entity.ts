export type LetterTypeEntity = Readonly<{
  Value: string;
  Label: Readonly<{
    LocalizedLabels: ReadonlyArray<
      Readonly<{
        LanguageCode: number;
        Label: string;
      }>
    >;
  }>;
}>;

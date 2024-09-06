export interface PreferredLanguageEntity {
  Value: number;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}

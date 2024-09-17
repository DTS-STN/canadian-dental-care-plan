export interface MaritalStatusEntity {
  Value: number;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}

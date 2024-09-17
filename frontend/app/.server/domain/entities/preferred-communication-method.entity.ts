export interface PreferredCommunicationMethodEntity {
  Value: number;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}

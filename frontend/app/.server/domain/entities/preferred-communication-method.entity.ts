import type { ReadonlyDeep } from 'type-fest';

export type PreferredCommunicationMethodEntity = ReadonlyDeep<{
  Value: string;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}>;

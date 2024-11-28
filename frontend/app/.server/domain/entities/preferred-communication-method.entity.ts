import type { ReadonlyDeep } from 'type-fest';

export type PreferredCommunicationMethodEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}>;

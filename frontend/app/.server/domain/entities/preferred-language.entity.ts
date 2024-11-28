import type { ReadonlyDeep } from 'type-fest';

export type PreferredLanguageEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: {
      LanguageCode: number;
      Label: string;
    }[];
  };
}>;

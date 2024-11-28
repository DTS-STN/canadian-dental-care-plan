import type { ReadonlyDeep } from 'type-fest';

export type MaritalStatusEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

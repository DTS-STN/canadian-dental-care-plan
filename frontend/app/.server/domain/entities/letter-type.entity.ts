import type { ReadonlyDeep } from 'type-fest';

export type LetterTypeEntity = ReadonlyDeep<{
  Value: string;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

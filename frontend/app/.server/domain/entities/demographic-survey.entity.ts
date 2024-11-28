import type { ReadonlyDeep } from 'type-fest';

export type IndigenousStatusEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

export type FirstNationsEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

export type DisabilityStatusEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

export type EthnicGroupEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

export type LocationBornStatusEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

export type GenderStatusEntity = ReadonlyDeep<{
  Value: number;
  Label: {
    LocalizedLabels: Array<{
      LanguageCode: number;
      Label: string;
    }>;
  };
}>;

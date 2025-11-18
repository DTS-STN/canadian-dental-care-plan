import type { ReadonlyDeep } from 'type-fest';

export type ClientEligibilityDto = ReadonlyDeep<{
  clientId: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  earnings: ReadonlyArray<{
    taxationYear: number;
    isEligible: boolean;
  }>;
}>;

export type ClientEligibilityRequestDto = ReadonlyDeep<
  Array<{
    clientNumber: string;
  }>
>;

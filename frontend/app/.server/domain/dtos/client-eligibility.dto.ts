export type ClientEligibilityDto = Readonly<{
  clientId: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  earnings: ReadonlyArray<{
    taxationYear: string;
    isEligible: boolean;
  }>;
}>;

export type ClientEligibilityRequestDto = Readonly<{
  clientIdentification: string;
}>;

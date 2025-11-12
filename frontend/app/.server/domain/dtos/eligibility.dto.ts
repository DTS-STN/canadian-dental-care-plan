export type EligibilityDto = Readonly<{
  clientId: string;
  firstName: string;
  lastName: string;
  earnings: ReadonlyArray<{
    taxationYear: string;
    isEligible: boolean;
  }>;
}>;

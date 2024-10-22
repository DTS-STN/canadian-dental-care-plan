export type ClientApplicationDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  hasAppliedBeforeApril302024: boolean;
  hasBeenAssessedByCRA: boolean;
  lastName: string;
  sin: string;
}>;

export type ClientApplicationBasicInfoRequestDto = Readonly<{
  clientNumber: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
}>;

export type ClientApplicationSinRequestDto = Readonly<{
  sin: string;
}>;

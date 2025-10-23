export type CommunicationPreferenceRequestDto = Readonly<{
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type UpdateDentalBenefitsRequestDto = Readonly<{
  clientId: string;
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
  province?: string;
}>;

export type UpdateEmailAddressRequestDto = Readonly<{
  clientId: string;
  email: string;
}>;

export type UpdatePhoneNumbersRequestDto = Readonly<{
  clientId: string;
  phoneNumber?: string;
  phoneNumberAlt?: string;
}>;

export type AddressRequestDto = Readonly<{
  address: string;
  apartment?: string;
  city: string;
  country: string;
  postalCode?: string;
  province?: string;
}>;

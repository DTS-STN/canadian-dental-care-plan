export type CommunicationPreferenceRequestDto = Readonly<{
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type UpdatePhoneNumbersRequestDto = Readonly<{
  clientId: string;
  phoneNumber?: string;
  phoneNumberAlt?: string;
}>;

export type DentalBenefitsRequestDto = Readonly<{
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
  province?: string;
}>;

export type EmailAddressRequestDto = Readonly<{
  email: string;
}>;

export type AddressRequestDto = Readonly<{
  address: string;
  apartment?: string;
  city: string;
  country: string;
  postalCode?: string;
  province?: string;
}>;

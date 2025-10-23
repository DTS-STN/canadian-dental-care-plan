export type UpdateCommunicationPreferenceRequestDto = Readonly<{
  clientId: string;
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

export type UpdateAddressRequestDto = Readonly<{
  clientId: string;
  mailingAddress: {
    address: string;
    apartment?: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  homeAddress: {
    address: string;
    apartment?: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
}>;

export type CommunicationPreferenceRequestDto = Readonly<{
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type PhoneNumberRequestDto = Readonly<{
  phoneNumber?: string;
  phoneNumberAlt?: string;
}>;

export type dentalBenefitsRequestDto = Readonly<{
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
  province?: string;
}>;

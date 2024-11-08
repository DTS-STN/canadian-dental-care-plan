export type BenefitApplicationDto = Readonly<{
  applicantInformation: Readonly<{
    firstName: string;
    lastName: string;
    maritalStatus: string;
    socialInsuranceNumber: string;
  }>;
  children: ReadonlyArray<
    Readonly<{
      readonly dentalBenefits: Readonly<{
        hasFederalBenefits: boolean;
        federalSocialProgram?: string;
        hasProvincialTerritorialBenefits: boolean;
        provincialTerritorialSocialProgram?: string;
        // province?: string; TODO verify if this is needed when mapping to entity
      }>;
      dentalInsurance: boolean;
      information: Readonly<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        isParent: boolean;
        hasSocialInsuranceNumber: boolean;
        socialInsuranceNumber?: string;
      }>;
    }>
  >;
  communicationPreferences: Readonly<{
    email?: string;
    preferredLanguage: string;
    preferredMethod: string;
  }>;
  contactInformation: Readonly<{
    copyMailingAddress: boolean;
    homeAddress: string;
    homeApartment?: string;
    homeCity: string;
    homeCountry: string;
    homePostalCode?: string;
    homeProvince?: string;
    mailingAddress: string;
    mailingApartment?: string;
    mailingCity: string;
    mailingCountry: string;
    mailingPostalCode?: string;
    mailingProvince?: string;
    phoneNumber?: string;
    phoneNumberAlt?: string;
    email?: string;
  }>;
  dateOfBirth: string;
  dentalBenefits?: Readonly<{
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    // province?: string; TODO verify if this is needed when mapping to entity
  }>;
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: Readonly<{
    // confirm: boolean; TODO verify if this is needed when mapping to entity
    dateOfBirth: string;
    firstName: string;
    lastName: string;
    socialInsuranceNumber: string;
  }>;
  typeOfApplication: 'adult' | 'adult-child' | 'child';
}>;

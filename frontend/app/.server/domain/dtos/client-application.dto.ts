interface InsurancePlanIdentification {
  IdentificationID: string;
}

interface InsurancePlan {
  InsurancePlanIdentification: InsurancePlanIdentification[];
}

interface ApplicantDetail {
  PrivateDentalInsuranceIndicator: boolean;
  InsurancePlan?: InsurancePlan[];
  ConsentToSharePersonalInformationIndicator?: boolean;
  AttestParentOrGuardianIndicator?: boolean;
}

interface PersonBirthDate {
  date: string;
}

interface ReferenceData {
  ReferenceDataID: string;
  ReferenceDataName?: string;
}

interface Address {
  AddressCategoryCode: {
    ReferenceDataName: string;
  };
  AddressCityName: string;
  AddressCountry: {
    CountryCode: ReferenceData;
  };
  AddressPostalCode: string;
  AddressProvince: {
    ProvinceCode: ReferenceData;
  };
  AddressSecondaryUnitText: string;
  AddressStreet: {
    StreetName: string;
  };
}

interface EmailAddress {
  EmailAddressID: string;
}

interface TelephoneNumber {
  TelephoneNumberCategoryCode: ReferenceData;
}

interface PersonContactInformation {
  Address: Address[];
  EmailAddress: EmailAddress[];
  TelephoneNumber: TelephoneNumber[];
}

interface PersonLanguage {
  CommunicationCategoryCode: ReferenceData;
  PreferredIndicator: boolean;
}

interface PersonMaritalStatus {
  StatusCode: ReferenceData;
}

interface PersonName {
  PersonGivenName: string[];
  PersonSurName: string;
}

interface PersonSINIdentification {
  IdentificationID: string;
}

interface RelatedPerson {
  PersonBirthDate: PersonBirthDate;
  PersonName: PersonName[];
  PersonRelationshipCode: {
    ReferenceDataName: string;
  };
  PersonSINIdentification: PersonSINIdentification;
  ApplicantDetail: ApplicantDetail;
}

interface Applicant {
  ApplicantDetail: ApplicantDetail;
  PersonBirthDate: PersonBirthDate;
  PersonContactInformation: PersonContactInformation[];
  PersonLanguage: PersonLanguage[];
  PersonMaritalStatus: PersonMaritalStatus;
  PersonName: PersonName[];
  PersonSINIdentification: PersonSINIdentification;
  RelatedPerson: RelatedPerson[];
  MailingSameAsHomeIndicator: boolean;
  PreferredMethodCommunicationCode: ReferenceData;
}

interface BenefitApplication {
  Applicant: Applicant;
  BenefitApplicationCategoryCode: ReferenceData;
  BenefitApplicationChannelCode: ReferenceData;
}

export interface ClientApplicationDto {
  BenefitApplication: BenefitApplication;
}

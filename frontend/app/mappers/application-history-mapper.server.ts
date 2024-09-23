import type { FederalGovernmentInsurancePlanService, ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services';
import type { ApplicationResponse } from '~/schemas/application-history-service-schemas.server';
import { getEnv } from '~/utils/env-utils.server';

export interface GetApplicationHistoryMapperArgs {
  federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService;
  provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService;
}

export function getApplicationHistoryMapper({ federalGovernmentInsurancePlanService, provincialGovernmentInsurancePlanService }: GetApplicationHistoryMapperArgs) {
  function toBenefitApplication(applications: ApplicationResponse[]) {
    return applications.map((application) => {
      return {
        id: application.ApplicationId,
        submittedOn: application.SubmittedDate ? application.SubmittedDate.replace(/\//g, '-') : '',
        status: application.ApplicationStatus,
        confirmationCode: application.ConfirmationCode,
        applicationDetails: application.Data.map((applicationDetails) => {
          return {
            typeOfApplication: toTypeOfApplication(applicationDetails.BenefitApplication.BenefitApplicationCategoryCode.ReferenceDataID),
            applicantInformation: toApplicantInformation(
              applicationDetails.BenefitApplication.Applicant.PersonMaritalStatus.StatusCode.ReferenceDataID,
              applicationDetails.BenefitApplication.Applicant.PersonName.at(0)?.PersonGivenName.at(0),
              applicationDetails.BenefitApplication.Applicant.PersonName.at(0)?.PersonSurName,
              applicationDetails.BenefitApplication.Applicant.PersonSINIdentification.IdentificationID,
            ),
            communicationPreferences: toCommunicationPreferences(
              applicationDetails.BenefitApplication.Applicant.PersonContactInformation.at(0)?.EmailAddress.at(0)?.EmailAddressID,
              applicationDetails.BenefitApplication.Applicant.PersonLanguage.at(0)?.CommunicationCategoryCode.ReferenceDataID,
              applicationDetails.BenefitApplication.Applicant.PreferredMethodCommunicationCode.ReferenceDataID,
            ),
            dateOfBirth: toDateString(applicationDetails.BenefitApplication.Applicant.PersonBirthDate),
            personalInformation: toPersonalInfo(applicationDetails.BenefitApplication.Applicant),
            children: toChildren(applicationDetails.BenefitApplication.Applicant.RelatedPerson.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Dependent')),
            partnerInformation:
              applicationDetails.BenefitApplication.Applicant.RelatedPerson.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Spouse').length > 0
                ? toPartnerInformation(applicationDetails.BenefitApplication.Applicant.RelatedPerson.filter((person) => person.PersonRelationshipCode.ReferenceDataName === 'Spouse').at(0))
                : undefined,
            disabilityTaxCredit: applicationDetails.BenefitApplication.Applicant.ApplicantDetail.DisabilityTaxCreditIndicator,
            livingIndependently: applicationDetails.BenefitApplication.Applicant.ApplicantDetail.LivingIndependentlyIndicator,
            dentalBenefits: applicationDetails.BenefitApplication.Applicant.ApplicantDetail.InsurancePlan?.at(0) ? toDentalBenefits(applicationDetails.BenefitApplication.Applicant.ApplicantDetail.InsurancePlan.at(0)) : undefined,
            dentalInsurance: applicationDetails.BenefitApplication.Applicant.ApplicantDetail.PrivateDentalInsuranceIndicator,
          };
        }),
      };
    });
  }

  function toTypeOfApplication(benefitApplicationCategoryCode: string) {
    const { APPLICANT_CATEGORY_CODE_INDIVIDUAL, APPLICANT_CATEGORY_CODE_FAMILY, APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY } = getEnv();
    if (benefitApplicationCategoryCode === APPLICANT_CATEGORY_CODE_INDIVIDUAL.toString()) return 'adult';
    if (benefitApplicationCategoryCode === APPLICANT_CATEGORY_CODE_FAMILY.toString()) return 'adult-child';
    if (benefitApplicationCategoryCode === APPLICANT_CATEGORY_CODE_DEPENDENT_ONLY.toString()) return 'child';

    throw Error(`TypeOfApplication '${benefitApplicationCategoryCode}' not supported.`);
  }

  interface ToPersonalInfoArgs {
    ApplicantDetail: {
      PrivateDentalInsuranceIndicator?: boolean;
      DisabilityTaxCreditIndicator?: boolean;
      LivingIndependentlyIndicator?: boolean;
      InsurancePlan?: { InsurancePlanIdentification?: { IdentificationID?: string }[] }[];
    };
    PersonBirthDate: { dateTime: string };
    PersonContactInformation: {
      Address: {
        AddressCategoryCode: { ReferenceDataName: string };
        AddressCityName: string;
        AddressCountry: { CountryCode: { ReferenceDataID: string } };
        AddressPostalCode: string;
        AddressProvince: { ProvinceCode: { ReferenceDataID: string } };
        AddressSecondaryUnitText: string;
        AddressStreet: { StreetName: string };
      }[];
      EmailAddress: { EmailAddressID: string }[];
      TelephoneNumber: { TelephoneNumberCategoryCode: { ReferenceDataName: string; ReferenceDataID: string } }[];
    }[];
    PersonLanguage: { CommunicationCategoryCode: { ReferenceDataID: string }; PreferredIndicator: boolean }[];
    PersonMaritalStatus: { StatusCode: { ReferenceDataID: string } };
    PersonName: { PersonGivenName: string[]; PersonSurName: string }[];
    PersonSINIdentification: { IdentificationID: string };
    RelatedPerson: {
      ApplicantDetail: {
        PrivateDentalInsuranceIndicator?: boolean;
        InsurancePlan?: { InsurancePlanIdentification?: { IdentificationID?: string }[] }[];
        ConsentToSharePersonalInformationIndicator?: boolean;
        AttestParentOrGuardianIndicator?: boolean;
      };
      PersonBirthDate: { dateTime: string };
      PersonName: { PersonGivenName: string[]; PersonSurName: string }[];
      PersonSINIdentification: { IdentificationID: string };
      PersonRelationshipCode: { ReferenceDataName: string };
    }[];
    MailingSameAsHomeIndicator: boolean;
    PreferredMethodCommunicationCode: { ReferenceDataID: string };
  }

  function toPersonalInfo(Applicant: ToPersonalInfoArgs) {
    return {
      copyMailingAddress: Applicant.MailingSameAsHomeIndicator,
      homeAddress: Applicant.PersonContactInformation[0].Address[1].AddressStreet.StreetName,
      homeApartment: Applicant.PersonContactInformation[0].Address[1].AddressSecondaryUnitText,
      homeCity: Applicant.PersonContactInformation[0].Address[1].AddressCityName,
      homeCountry: Applicant.PersonContactInformation[0].Address[1].AddressCountry.CountryCode.ReferenceDataID,
      homePostalCode: Applicant.PersonContactInformation[0].Address[1].AddressPostalCode,
      homeProvince: Applicant.PersonContactInformation[0].Address[1].AddressProvince.ProvinceCode.ReferenceDataID,
      mailingAddress: Applicant.PersonContactInformation[0].Address[0].AddressStreet.StreetName,
      mailingApartment: Applicant.PersonContactInformation[0].Address[0].AddressSecondaryUnitText,
      mailingCity: Applicant.PersonContactInformation[0].Address[0].AddressCityName,
      mailingCountry: Applicant.PersonContactInformation[0].Address[0].AddressCountry.CountryCode.ReferenceDataID,
      mailingPostalCode: Applicant.PersonContactInformation[0].Address[0].AddressPostalCode,
      mailingProvince: Applicant.PersonContactInformation[0].Address[0].AddressProvince.ProvinceCode.ReferenceDataID,
      phoneNumber: Applicant.PersonContactInformation[0].TelephoneNumber.filter((telephonneInfo) => telephonneInfo.TelephoneNumberCategoryCode.ReferenceDataName === 'Primary').at(0)?.TelephoneNumberCategoryCode.ReferenceDataID,
      phoneNumberAlt: Applicant.PersonContactInformation[0].TelephoneNumber.filter((telephonneInfo) => telephonneInfo.TelephoneNumberCategoryCode.ReferenceDataName === 'Alternate').at(0)?.TelephoneNumberCategoryCode.ReferenceDataID,
    };
  }

  function toDateString(PersonBirthDate: { dateTime?: string }) {
    return PersonBirthDate.dateTime;
  }
  interface ToInsurancePlanArgs {
    InsurancePlanIdentification?: { IdentificationID?: string }[];
  }

  function toDentalBenefits(insurancePlan?: ToInsurancePlanArgs) {
    const insuranceInfo: { hasFederalBenefits: boolean; federalSocialProgram?: string; hasProvincialTerritorialBenefits: boolean; provincialTerritorialSocialProgram?: string; province?: string } = {
      hasFederalBenefits: false,
      federalSocialProgram: undefined,
      provincialTerritorialSocialProgram: undefined,
      hasProvincialTerritorialBenefits: false,
      province: undefined,
    };

    insurancePlan?.InsurancePlanIdentification?.forEach((insuranceId) => {
      const federalSocialProgramEntity = insuranceId.IdentificationID ? federalGovernmentInsurancePlanService.findById(insuranceId.IdentificationID) : undefined;
      if (federalSocialProgramEntity) {
        insuranceInfo.hasFederalBenefits = true;
        insuranceInfo.federalSocialProgram = insuranceId.IdentificationID;
      }
      const provincialGovernmentInsurancePlan = insuranceId.IdentificationID ? provincialGovernmentInsurancePlanService.findById(insuranceId.IdentificationID) : undefined;
      if (provincialGovernmentInsurancePlan) {
        insuranceInfo.hasProvincialTerritorialBenefits = true;
        insuranceInfo.provincialTerritorialSocialProgram = insuranceId.IdentificationID;
        insuranceInfo.province = provincialGovernmentInsurancePlan.provinceTerritoryStateId;
      }
    });

    return insuranceInfo;
  }

  function toApplicantInformation(maritalStatus: string, firstName?: string, lastName?: string, sin?: string) {
    return {
      maritalStatus: maritalStatus,
      firstName: firstName,
      lastName: lastName,
      socialInsuranceNumber: sin,
    };
  }

  function toCommunicationPreferences(emailAddressID?: string, preferredLanguage?: string, preferredMethod?: string) {
    return {
      email: emailAddressID,
      preferredLanguage: preferredLanguage,
      preferredMethod: preferredMethod,
    };
  }

  interface ToChildrenResult {
    information: { isParent?: boolean; firstName?: string; lastName?: string; dateOfBirth?: string; hasSocialInsuranceNumber?: boolean; socialInsuranceNumber?: string };
    dentalInsurance?: boolean;
    dentalBenefits?: {
      hasFederalBenefits?: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    };
  }

  function toChildren(relatedPeople: ToRelatedPersonArgs[]) {
    const children: ToChildrenResult[] = [];

    relatedPeople.forEach((child) => {
      const dentalBenefits = toDentalBenefits(child.ApplicantDetail.InsurancePlan?.at(0));
      children.push({
        information: {
          isParent: child.ApplicantDetail.AttestParentOrGuardianIndicator,
          firstName: child.PersonName.at(0)?.PersonGivenName.at(0),
          lastName: child.PersonName.at(0)?.PersonSurName,
          dateOfBirth: child.PersonBirthDate.dateTime,
          socialInsuranceNumber: child.PersonSINIdentification.IdentificationID,
          hasSocialInsuranceNumber: child.PersonSINIdentification.IdentificationID ? true : false,
        },
        dentalInsurance: child.ApplicantDetail.PrivateDentalInsuranceIndicator,
        dentalBenefits: dentalBenefits,
      });
    });
    return children.length > 0 ? children : undefined;
  }

  interface ToRelatedPersonArgs {
    ApplicantDetail: {
      PrivateDentalInsuranceIndicator?: boolean;
      InsurancePlan?: { InsurancePlanIdentification?: { IdentificationID?: string }[] }[];
      ConsentToSharePersonalInformationIndicator?: boolean;
      AttestParentOrGuardianIndicator?: boolean;
    };
    PersonBirthDate: { dateTime: string };
    PersonName: { PersonGivenName: string[]; PersonSurName: string }[];
    PersonSINIdentification: { IdentificationID: string };
    PersonRelationshipCode: { ReferenceDataName: string };
  }

  interface ToPartnerResult {
    confirm?: boolean;
    dateOfBirth?: string;
    firstName?: string;
    lastName?: string;
    socialInsuranceNumber?: string;
  }

  function toPartnerInformation(relatedPerson?: ToRelatedPersonArgs): ToPartnerResult {
    return {
      confirm: relatedPerson?.ApplicantDetail.ConsentToSharePersonalInformationIndicator,
      dateOfBirth: relatedPerson?.PersonBirthDate.dateTime,
      firstName: relatedPerson?.PersonName.at(0)?.PersonGivenName.at(0),
      lastName: relatedPerson?.PersonName.at(0)?.PersonSurName,
      socialInsuranceNumber: relatedPerson?.PersonSINIdentification.IdentificationID,
    };
  }

  return { toBenefitApplication };
}

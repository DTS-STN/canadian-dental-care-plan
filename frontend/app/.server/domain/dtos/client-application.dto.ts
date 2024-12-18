import type { ReadonlyDeep } from 'type-fest';

import type { ApplicantInformationDto, ChildDto, CommunicationPreferencesDto, ContactInformationDto } from '~/.server/domain/dtos/benefit-application.dto';

export type ClientApplicationDto = ReadonlyDeep<{
  applicantInformation: ClientApplicantInformationDto;
  children: ClientChildDto[];
  communicationPreferences: CommunicationPreferencesDto;
  contactInformation: ContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  hasFiledTaxes: boolean;
  isInvitationToApplyClient: boolean;
  livingIndependently?: boolean;
  partnerInformation?: ClientPartnerInformationDto;
}>;

export type ClientApplicantInformationDto = ApplicantInformationDto & { clientNumber?: string };

export type ClientChildDto = Omit<ChildDto, 'information'> & {
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isParent: boolean;
    clientNumber?: string;
    socialInsuranceNumber: string;
  };
};

export type ClientPartnerInformationDto = ReadonlyDeep<{
  confirm: boolean;
  yearOfBirth: string;
  firstName: string;
  lastName: string;
  socialInsuranceNumber: string;
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

import type { ReadonlyDeep } from 'type-fest';

import type { ApplicantInformationDto, ChildDto, CommunicationPreferencesDto, ContactInformationDto, PartnerInformationDto } from './benefit-application.dto';

export type ClientApplicationDto = ReadonlyDeep<{
  applicantInformation: ApplicantInformationDto & { clientNumber?: string };
  children: (Omit<ChildDto, 'information'> & {
    information: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      isParent: boolean;
      clientNumber?: string;
      socialInsuranceNumber: string;
    };
  })[];
  communicationPreferences: CommunicationPreferencesDto;
  contactInformation: ContactInformationDto;
  dateOfBirth: string;
  dentalBenefits: string[];
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  hasFiledTaxes: boolean;
  isInvitationToApplyClient: boolean;
  livingIndependently?: boolean;
  partnerInformation?: PartnerInformationDto;
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

import { injectable } from 'inversify';

import type { BenefitRenewalDto, ClientApplicationDto } from '~/.server/domain/dtos';
import type {
  AddressInformationState,
  ApplicantInformationState,
  ChildState,
  ConfirmDentalBenefitsState,
  ContactInformationState,
  DentalFederalBenefitsState,
  DentalProvincialTerritorialBenefitsState,
  PartnerInformationState,
  TypeOfRenewalState,
} from '~/route-helpers/renew-route-helpers.server';

export interface RenewAdultChildState {
  addressInformation?: AddressInformationState;
  applicantInformation: ApplicantInformationState;
  children: ChildState[];
  clientApplication: ClientApplicationDto;
  confirmDentalBenefits: ConfirmDentalBenefitsState;
  contactInformation: ContactInformationState;
  dentalBenefits?: DentalFederalBenefitsState & DentalProvincialTerritorialBenefitsState;
  dentalInsurance: boolean;
  hasAddressChanged: boolean;
  hasMaritalStatusChanged: boolean;
  maritalStatus?: string;
  partnerInformation?: PartnerInformationState;
  typeOfRenewal: Extract<TypeOfRenewalState, 'adult-child'>;
}

export interface BenefitRenewalStateMapper {
  mapRenewAdultChildStateToBenefitRenewalDto(renewAdultChildState: RenewAdultChildState): BenefitRenewalDto;
}

@injectable()
export class BenefitRenewalStateMapperImpl implements BenefitRenewalStateMapper {
  mapRenewAdultChildStateToBenefitRenewalDto(renewAdultChildState: RenewAdultChildState): BenefitRenewalDto {
    // TODO use the clientApplicationDto with the 'State' objects to form the BenefitRenewalDto somehow
    throw new Error('Method not implemented.');
  }
}

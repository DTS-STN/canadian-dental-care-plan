import { inject, injectable } from 'inversify';
import { Result } from 'oxide.ts';

import type { ClientEligibilityDto, ClientEligibilityRequestDto } from '../dtos/client-eligibility.dto';
import type { ClientEligibilityEntity, ClientEligibilityRequestEntity } from '../entities/client-eligibility.entity';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';

export interface ClientEligibilityDtoMapper {
  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto;
  mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto: ClientEligibilityRequestDto): ClientEligibilityRequestEntity;
}

type DefaultClientEligibilityDtoMapperServerConfig = Pick<ServerConfig, 'COVERAGE_CATEGORY_CODE_COPAY_TIER_TPC'>;

@injectable()
export class DefaultClientEligibilityDtoMapper implements ClientEligibilityDtoMapper {
  readonly serverConfig: DefaultClientEligibilityDtoMapperServerConfig;

  constructor(@inject(TYPES.ServerConfig) serverConfig: DefaultClientEligibilityDtoMapperServerConfig) {
    this.serverConfig = serverConfig;
  }

  mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity: ClientEligibilityEntity): ClientEligibilityDto {
    const applicant = clientEligibilityEntity.Applicant;

    return {
      clientId: Result.from(applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client ID')?.IdentificationID).expect('Client ID not found'),
      clientNumber: Result.from(applicant.ClientIdentification.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID).expect('Client Number not found'),
      firstName: Result.from(applicant.PersonName.at(0)?.PersonGivenName.at(0)).expect('First name not found'),
      lastName: Result.from(applicant.PersonName.at(0)?.PersonSurName).expect('Last name not found'),
      earnings: applicant.ApplicantEarning.map((earning) => this.mapApplicantEarningToClientEligibilityEarning(earning)),
      eligibilityStatusCode: applicant.BenefitEligibilityStatus?.StatusCode?.ReferenceDataID,
      eligibilityStatusCodeNextYear: applicant.BenefitEligibilityNextYearStatus?.StatusCode?.ReferenceDataID,
      enrollmentStatusCode: applicant.ApplicantEnrollmentStatus?.StatusCode?.ReferenceDataID,
    };
  }

  private mapApplicantEarningToClientEligibilityEarning(earning: ClientEligibilityEntity['Applicant']['ApplicantEarning'][number]): ClientEligibilityDto['earnings'][number] {
    const eligibilityStatusCode = earning.BenefitEligibilityStatus.StatusCode.ReferenceDataID;
    const earningCopayTierTpcCoverage = earning.Coverage.find((coverage) => {
      return (
        coverage.CoverageCategoryCode.ReferenceDataName === this.serverConfig.COVERAGE_CATEGORY_CODE_COPAY_TIER_TPC && //
        typeof coverage.CoverageCategoryCode.CoverageTierCode.ReferenceDataID === 'string' &&
        isValidCoverageCopayTierCode(coverage.CoverageCategoryCode.CoverageTierCode.ReferenceDataID)
      );
    });

    return {
      applicationYearId: earning.BenefitApplicationYearIdentification.IdentificationID,
      coverageCopayTierTpcCode: earningCopayTierTpcCoverage?.CoverageCategoryCode.CoverageTierCode.ReferenceDataID,
      eligibilityStatusCode: eligibilityStatusCode,
      taxationYear: Number.parseInt(earning.EarningTaxationYear.YearDate),
    };
  }

  mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto: ClientEligibilityRequestDto): ClientEligibilityRequestEntity {
    return clientEligibilityRequestDto.map((dto) => ({
      Applicant: {
        PersonClientNumberIdentification: {
          IdentificationID: dto.clientNumber,
          IdentificationCategoryText: 'Client Number',
        },
      },
    }));
  }
}

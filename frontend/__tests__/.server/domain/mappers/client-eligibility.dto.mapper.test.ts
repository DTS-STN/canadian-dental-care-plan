// generate unit tests for app/.server/domain/mappers/client-eligibility.dto.mapper.ts with vitest
import { beforeEach, describe, expect, it } from 'vitest';

import type { ClientEligibilityEntity } from '~/.server/domain/entities/client-eligibility.entity';
import { DefaultClientEligibilityDtoMapper } from '~/.server/domain/mappers/client-eligibility.dto.mapper';

describe('DefaultClientEligibilityDtoMapper', () => {
  let mapper: DefaultClientEligibilityDtoMapper;

  beforeEach(() => {
    const serverConfig = {
      COVERAGE_CATEGORY_CODE_COPAY_TIER_TPC: 'Co-Pay Tier (TPC)',
      ELIGIBILITY_STATUS_CODE_ELIGIBLE: 'status-001',
      ELIGIBILITY_STATUS_CODE_INELIGIBLE: 'status-002',
    };
    mapper = new DefaultClientEligibilityDtoMapper(serverConfig);
  });

  describe('mapClientEligibilityEntityToClientEligibilityDto', () => {
    it('should map ClientEligibilityEntity to ClientEligibilityDto correctly', () => {
      const clientEligibilityEntity: ClientEligibilityEntity = {
        Applicant: {
          ClientIdentification: [
            { IdentificationCategoryText: 'Client ID', IdentificationID: '12345' },
            { IdentificationCategoryText: 'Client Number', IdentificationID: '67890' },
          ],
          PersonName: [{ PersonGivenName: ['John'], PersonSurName: 'Doe' }],
          ApplicantEarning: [
            {
              EarningTaxationYear: { YearDate: '2022' },
              BenefitEligibilityStatus: { StatusCode: { ReferenceDataID: 'status-001' } },
              Coverage: [
                {
                  CoverageCategoryCode: {
                    ReferenceDataName: 'Co-Pay Tier (TPC)',
                    CoverageTierCode: { ReferenceDataID: 'coverage-001' },
                  },
                },
              ],
              BenefitApplicationYearIdentification: {
                IdentificationID: '2022',
                IdentificationCategoryText: 'Benefit Application Year',
              },
              EarningIdentification: [
                {
                  IdentificationCategoryText: 'Earning ID',
                  IdentificationID: 'earning-001',
                },
              ],
              PrivateDentalInsuranceIndicator: false,
            },
            {
              EarningTaxationYear: { YearDate: '2023' },
              BenefitEligibilityStatus: { StatusCode: { ReferenceDataID: 'status-002' } },
              Coverage: [
                {
                  CoverageCategoryCode: {
                    ReferenceDataName: 'Other Tier',
                    CoverageTierCode: { ReferenceDataID: 'coverage-002' },
                  },
                },
              ],
              BenefitApplicationYearIdentification: {
                IdentificationID: '2023',
                IdentificationCategoryText: 'Benefit Application Year',
              },
              EarningIdentification: [
                {
                  IdentificationCategoryText: 'Earning ID',
                  IdentificationID: 'earning-002',
                },
              ],
              PrivateDentalInsuranceIndicator: true,
            },
          ],
          ApplicantCategoryCode: {
            ReferenceDataID: 'applicant-category-001',
          },

          ApplicantEnrollmentStatus: {
            StatusCode: {
              ReferenceDataID: 'enrollment-status-001',
            },
          },
          BenefitEligibilityStatus: {
            StatusCode: {
              ReferenceDataID: 'status-001',
            },
          },
          BenefitEligibilityNextYearStatus: {
            StatusCode: {
              ReferenceDataID: 'status-001',
            },
          },
          BenefitApplicationYearIdentification: {
            IdentificationID: 'benefit-application-year-identification-001',
            IdentificationCategoryText: 'Benefit Application Year',
          },
        },
      };

      const result = mapper.mapClientEligibilityEntityToClientEligibilityDto(clientEligibilityEntity);

      expect(result).toEqual({
        clientId: '12345',
        clientNumber: '67890',
        earnings: [
          {
            hasCopayTierCoverage: true,
            isEligible: true,
            statusCode: 'status-001',
            taxationYear: 2022,
          },
          {
            hasCopayTierCoverage: false,
            isEligible: false,
            statusCode: 'status-002',
            taxationYear: 2023,
          },
        ],
        eligibilityStatusCode: 'status-001',
        eligibilityStatusCodeNextYear: 'status-001',
        enrollmentStatusCode: 'enrollment-status-001',
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });

  describe('mapClientEligibilityRequestDtoToClientEligibilityRequestEntity', () => {
    it('should map ClientEligibilityRequestDto to ClientEligibilityRequestEntity correctly', () => {
      const clientEligibilityRequestDto = [{ clientNumber: '67890' }];

      const result = mapper.mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto);

      expect(result).toEqual([
        {
          Applicant: {
            PersonClientNumberIdentification: {
              IdentificationID: '67890',
              IdentificationCategoryText: 'Client Number',
            },
          },
        },
      ]);
    });
  });
});

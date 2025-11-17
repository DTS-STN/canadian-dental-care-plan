import { describe, expect, it } from 'vitest';

import type { ClientEligibilityEntity } from '~/.server/domain/entities/client-eligibility.entity';
import { DefaultClientEligibilityDtoMapper } from '~/.server/domain/mappers';

describe('DefaultClientEligibilityDtoMapper', () => {
  const mapper = new DefaultClientEligibilityDtoMapper();

  describe('mapClientEligibilityEntityToClientEligibilityDto', () => {
    it('should map a valid client eligibility entity to DTO', () => {
      const entity: ClientEligibilityEntity = {
        Applicant: {
          ApplicantEarning: [
            {
              BenefitApplicationYearIdentification: {
                IdentificationID: '2024-benefit-id',
                IdentificationCategoryText: 'Benefit Year ID',
              },
              BenefitEligibilityStatus: {
                StatusCode: {
                  ReferenceDataID: 'eligible-status-001',
                },
              },
              Coverage: [
                {
                  CoverageCategoryCode: {
                    ReferenceDataName: 'Co-Pay Tier (TPC)',
                    CoverageTierCode: {
                      ReferenceDataID: '001',
                    },
                  },
                },
              ],
              EarningIdentification: [
                {
                  IdentificationID: 'earning-id-2024',
                  IdentificationCategoryText: 'Earning ID',
                },
              ],
              EarningTaxationYear: {
                YearDate: '2024',
              },
              PrivateDentalInsuranceIndicator: false,
            },
            {
              BenefitApplicationYearIdentification: {
                IdentificationID: '2023-benefit-id',
                IdentificationCategoryText: 'Benefit Year ID',
              },
              BenefitEligibilityStatus: {
                StatusCode: {
                  ReferenceDataID: 'eligible-status-002',
                },
              },
              Coverage: [
                {
                  CoverageCategoryCode: {
                    ReferenceDataName: 'Co-Pay Tier (TPC)',
                    CoverageTierCode: {
                      ReferenceDataID: '001',
                    },
                  },
                },
              ],
              EarningIdentification: [
                {
                  IdentificationID: 'earning-id-2023',
                  IdentificationCategoryText: 'Earning ID',
                },
              ],
              EarningTaxationYear: {
                YearDate: '2023',
              },
              PrivateDentalInsuranceIndicator: true,
            },
            {
              BenefitApplicationYearIdentification: {
                IdentificationID: '2022-benefit-id',
                IdentificationCategoryText: 'Benefit Year ID',
              },
              BenefitEligibilityStatus: {
                StatusCode: {
                  ReferenceDataID: 'ineligible-status-001',
                },
              },
              Coverage: [],
              EarningIdentification: [
                {
                  IdentificationID: 'earning-id-2022',
                  IdentificationCategoryText: 'Earning ID',
                },
              ],
              EarningTaxationYear: {
                YearDate: '2022',
              },
              PrivateDentalInsuranceIndicator: false,
            },
          ],
          ApplicantCategoryCode: {
            ReferenceDataID: 'primary-applicant',
          },
          ApplicantEnrollmentStatus: {
            StatusCode: {
              ReferenceDataID: 'enrolled',
            },
          },
          BenefitEligibilityStatus: {
            StatusCode: {
              ReferenceDataID: 'eligible',
            },
          },
          BenefitEligibilityNextYearStatus: {
            StatusCode: {
              ReferenceDataID: 'eligible',
            },
          },
          BenefitApplicationYearIdentification: {
            IdentificationID: 'current-benefit-year-id',
            IdentificationCategoryText: 'Current Benefit Year',
          },
          ClientIdentification: [
            {
              IdentificationID: '12345',
              IdentificationCategoryText: 'Client ID',
            },
            {
              IdentificationID: '67890',
              IdentificationCategoryText: 'Client Number',
            },
          ],
          PersonName: [
            {
              PersonGivenName: ['John'],
              PersonSurName: 'Doe',
            },
          ],
        },
      };

      const result = mapper.mapClientEligibilityEntityToClientEligibilityDto(entity);

      expect(result).toEqual({
        clientId: '12345',
        clientNumber: '67890',
        firstName: 'John',
        lastName: 'Doe',
        earnings: [
          { taxationYear: '2024', isEligible: true },
          { taxationYear: '2023', isEligible: true },
          { taxationYear: '2022', isEligible: false },
        ],
      });
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { AddressCorrectionResultDto, AddressCorrectionStatus } from '~/.server/domain/dtos';
import type { AddressCorrectionResultEntity } from '~/.server/domain/entities';
import { AddressValidationDtoMapperImpl } from '~/.server/domain/mappers';

describe('AddressValidationDtoMapperImpl', () => {
  describe('mapAddressCorrectionResultEntityToAddressCorrectionResultDto', () => {
    it.each([
      { statusCode: 'Corrected', expectedStatus: 'Corrected' as AddressCorrectionStatus },
      { statusCode: 'NotCorrect', expectedStatus: 'NotCorrect' as AddressCorrectionStatus },
      { statusCode: 'Valid', expectedStatus: 'Valid' as AddressCorrectionStatus },
    ])('should map AddressCorrectionResultEntity to AddressCorrectionResultDto with correct status', ({ statusCode, expectedStatus }) => {
      const mockEntity: AddressCorrectionResultEntity = {
        'wsaddr:CorrectionResults': {
          'nc:AddressFullText': '123 Fake St',
          'nc:AddressCityName': 'North Pole',
          'nc:AddressPostalCode': 'H0H 0H0',
          'can:ProvinceCode': 'ON',
          'wsaddr:Information': {
            'wsaddr:StatusCode': statusCode,
          },
        },
      };

      const expectedDto: AddressCorrectionResultDto = {
        status: expectedStatus,
        address: '123 Fake St',
        city: 'North Pole',
        postalCode: 'H0H 0H0',
        provinceCode: 'ON',
      };

      const mapper = new AddressValidationDtoMapperImpl();
      const dto = mapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });

    it('should throw error for unknown status', () => {
      const mockEntity: AddressCorrectionResultEntity = {
        'wsaddr:CorrectionResults': {
          'nc:AddressFullText': '123 Fake St',
          'nc:AddressCityName': 'North Pole',
          'nc:AddressPostalCode': 'H0H 0H0',
          'can:ProvinceCode': 'ON',
          'wsaddr:Information': {
            'wsaddr:StatusCode': 'Invalid status',
          },
        },
      };

      const mapper = new AddressValidationDtoMapperImpl();
      expect(() => mapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto(mockEntity)).toThrowError();
    });
  });
});

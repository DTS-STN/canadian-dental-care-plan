import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { AddressCorrectionResultDto } from '~/.server/domain/dtos';
import type { AddressCorrectionResultEntity } from '~/.server/domain/entities';
import type { AddressValidationDtoMapper } from '~/.server/domain/mappers';
import type { AddressValidationRepository } from '~/.server/domain/repositories';
import { AddressValidationServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

describe('AddressValidationServiceImpl', () => {
  describe('getAddressCorrectionResult', () => {
    it('should return address correction result DTO', async () => {
      const mockLogFactory = mock<LogFactory>();
      mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

      const mockAddressCorrectionResultDto: AddressCorrectionResultDto = {
        status: 'Corrected',
        address: '123 Fake St',
        city: 'North Pole',
        postalCode: 'H0H 0H0',
        provinceCode: 'ON',
      };
      const mockAddressValidationDtoMapper = mock<AddressValidationDtoMapper>();
      mockAddressValidationDtoMapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto.mockReturnValue(mockAddressCorrectionResultDto);

      const mockAddressCorrectionResultEntity: AddressCorrectionResultEntity = {
        'wsaddr:CorrectionResults': {
          'nc:AddressFullText': '123 Fake St',
          'nc:AddressCityName': 'North Pole',
          'nc:AddressPostalCode': 'H0H 0H0',
          'can:ProvinceCode': 'ON',
          'wsaddr:Information': {
            'wsaddr:StatusCode': 'Corrected',
          },
        },
      };
      const mockAddressValidationRepository = mock<AddressValidationRepository>();
      mockAddressValidationRepository.getAddressCorrectionResult.mockResolvedValue(mockAddressCorrectionResultEntity);

      const service = new AddressValidationServiceImpl(mockLogFactory, mockAddressValidationDtoMapper, mockAddressValidationRepository);

      const result = await service.getAddressCorrectionResult({ address: '123 Fake Street', city: 'North Pole', provinceCode: 'ON', postalCode: 'H0H 0H0' });
      expect(result).toEqual(mockAddressCorrectionResultDto);
    });
  });
});

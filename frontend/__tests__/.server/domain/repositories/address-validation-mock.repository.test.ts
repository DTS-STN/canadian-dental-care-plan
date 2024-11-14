import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';
import { AddressValidationRepositoryMock } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

describe('AddressValidationRepositoryMock', () => {
  const mockLogFactory = mock<LogFactory>({ createLogger: () => mock<Logger>() });

  it('should return a mocked address correction result', async () => {
    const addressCorrectionRequest: AddressCorrectionRequestEntity = {
      address: '111 Wellington Street',
      city: 'Ottawa',
      postalCode: 'K1A 0A9',
      provinceCode: 'ON',
    };

    // vi.mocked(fakerEN_CA.location.streetAddress).mockReturnValue(addressCorrectionRequest.address);

    const repository = new AddressValidationRepositoryMock(mockLogFactory);
    const result = await repository.getAddressCorrectionResult(addressCorrectionRequest);

    expect(result).toEqual({
      'wsaddr:CorrectionResults': {
        'nc:AddressFullText': expect.any(String),
        'nc:AddressCityName': addressCorrectionRequest.city.toUpperCase(),
        'can:ProvinceCode': addressCorrectionRequest.provinceCode.toUpperCase(),
        'nc:AddressPostalCode': addressCorrectionRequest.postalCode.toUpperCase(),
        'wsaddr:Information': {
          'wsaddr:StatusCode': expect.any(String),
        },
      },
    } satisfies AddressCorrectionResultEntity);
  });
});

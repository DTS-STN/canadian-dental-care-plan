import type { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import { ContainerServiceProviderImpl } from '~/.server/providers/container-service.provider';

describe('ContainerServiceProviderImpl', () => {
  it("should call the container's get function with the correct identifier", () => {
    const mockContainer = mock<Container>({ get: vi.fn().mockImplementation((serviceIdentifier) => serviceIdentifier) });

    const serviceProvider = new ContainerServiceProviderImpl(mockContainer);

    serviceProvider.getClientFriendlyStatusService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE);

    serviceProvider.getCountryService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.COUNTRY_SERVICE);

    serviceProvider.getFederalGovernmentInsurancePlanService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_SERVICE);

    serviceProvider.getMaritalStatusService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE);

    serviceProvider.getPreferredCommunicationMethodService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE);

    serviceProvider.getPreferredLanguageService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE);

    serviceProvider.getProvinceTerritoryStateService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE);

    serviceProvider.getProvincialGovernmentInsurancePlanService();
    expect(mockContainer.get).toBeCalledWith(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE);
  });
});

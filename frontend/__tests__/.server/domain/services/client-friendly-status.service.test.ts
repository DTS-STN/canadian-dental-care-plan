import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ClientFriendlyStatusDto, ClientFriendlyStatusLocalizedDto } from '~/.server/domain/dtos';
import { ClientFriendlyStatusNotFoundException } from '~/.server/domain/exceptions/ClientFriendlyStatusNotFoundException';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories';
import type { ClientFriendlyStatusServiceImpl_ServerConfig } from '~/.server/domain/services';
import { ClientFriendlyStatusServiceImpl } from '~/.server/domain/services';
import type { LogFactory, Logger } from '~/.server/factories';

vi.mock('moize');

describe('ClientFriendlyStatusServiceImpl', () => {
  const mockServerConfig: ClientFriendlyStatusServiceImpl_ServerConfig = {
    LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig); // Act and Assert

      expect(service.getClientFriendlyStatusById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('getClientFriendlyStatusById', () => {
    it('fetches client friendly status by id', () => {
      const id = '1';
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findById.mockReturnValueOnce({
        esdc_clientfriendlystatusid: '1',
        esdc_descriptionenglish: 'You have qualified for the Canadian Dental Care Plan.',
        esdc_descriptionfrench: 'Vous êtes admissible au Régime canadien de soins dentaires.',
      });

      const mockDto: ClientFriendlyStatusDto = {
        id: '1',
        nameEn: 'You have qualified for the Canadian Dental Care Plan.',
        nameFr: 'Vous êtes admissible au Régime canadien de soins dentaires.',
      };

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();
      mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto.mockReturnValueOnce(mockDto);

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      const dto = service.getClientFriendlyStatusById(id);

      expect(dto).toEqual(mockDto);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto).toHaveBeenCalledTimes(1);
    });

    it('fetches client friendly status by id throws not found exception', () => {
      const id = '1033';
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findById.mockReturnValueOnce(null);

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      expect(() => service.getClientFriendlyStatusById(id)).toThrow(ClientFriendlyStatusNotFoundException);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto).not.toHaveBeenCalled();
    });
  });

  describe('getLocalizedClientFriendlyStatusById', () => {
    it('fetches localized client friendly status by id', () => {
      const id = '1';
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findById.mockReturnValueOnce({
        esdc_clientfriendlystatusid: '1',
        esdc_descriptionenglish: 'You have qualified for the Canadian Dental Care Plan.',
        esdc_descriptionfrench: 'Vous êtes admissible au Régime canadien de soins dentaires.',
      });

      const mockDto: ClientFriendlyStatusLocalizedDto = { id: '1', name: 'You have qualified for the Canadian Dental Care Plan.' };

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();
      mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusDtoToClientFriendlyStatusLocalizedDto.mockReturnValueOnce(mockDto);

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      const dto = service.getLocalizedClientFriendlyStatusById(id, 'en');

      expect(dto).toEqual(mockDto);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusDtoToClientFriendlyStatusLocalizedDto).toHaveBeenCalledTimes(1);
    });

    it('fetches localized client friendly status by id throws not found exception', () => {
      const id = '1033';
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findById.mockReturnValueOnce(null);

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      expect(() => service.getClientFriendlyStatusById(id)).toThrow(ClientFriendlyStatusNotFoundException);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusDtoToClientFriendlyStatusLocalizedDto).not.toHaveBeenCalled();
    });
  });
});

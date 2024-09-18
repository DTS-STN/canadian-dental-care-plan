import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs/server.config';
import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos/client-friendly-status.dto';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories/client-friendly-status.repository';
import { ClientFriendlyStatusServiceImpl } from '~/.server/domain/services/client-friendly-status.service';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';

vi.mock('moize');

describe('ClientFriendlyStatusServiceImpl', () => {
  const mockServerConfig: Pick<ServerConfig, 'LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS' | 'LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS'> = {
    LOOKUP_SVC_ALL_CLIENT_FRIENDLY_STATUSES_CACHE_TTL_SECONDS: 10,
    LOOKUP_SVC_CLIENT_FRIENDLY_STATUS_CACHE_TTL_SECONDS: 5,
  };

  const mockLogFactory = mock<LogFactory>();
  mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

  describe('constructor', () => {
    it('sets the correct maxAge for moize options', () => {
      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig); // Act and Assert

      expect(service.findAll.options.maxAge).toBe(10000); // 10 seconds in milliseconds
      expect(service.findById.options.maxAge).toBe(5000); // 5 seconds in milliseconds
    });
  });

  describe('findAll', () => {
    it('fetches all client friendly statuses', () => {
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findAll.mockReturnValueOnce([
        {
          esdc_clientfriendlystatusid: '1',
          esdc_descriptionenglish: 'You have qualified for the Canadian Dental Care Plan.',
          esdc_descriptionfrench: 'Vous êtes admissible au Régime canadien de soins dentaires.',
        },
        {
          esdc_clientfriendlystatusid: '2',
          esdc_descriptionenglish: 'We reviewed your application for the Canadian Dental Care Plan.',
          esdc_descriptionfrench: "Nous avons examiné votre demande d'adhésion au Régime canadien de soins dentaires.",
        },
      ]);

      const mockDtos: ClientFriendlyStatusDto[] = [
        {
          id: '1',
          nameEn: 'You have qualified for the Canadian Dental Care Plan.',
          nameFr: 'Vous êtes admissible au Régime canadien de soins dentaires.',
        },
        {
          id: '2',
          nameEn: 'We reviewed your application for the Canadian Dental Care Plan.',
          nameFr: "Nous avons examiné votre demande d'adhésion au Régime canadien de soins dentaires.",
        },
      ];

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();
      mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos.mockReturnValueOnce(mockDtos);

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      const dtos = service.findAll();

      expect(dtos).toEqual(mockDtos);
      expect(mockClientFriendlyStatusRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
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

      const dto = service.findById(id);

      expect(dto).toEqual(mockDto);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto).toHaveBeenCalledTimes(1);
    });

    it('fetches client friendly status by id returns null if not found', () => {
      const id = '1033';
      const mockClientFriendlyStatusRepository = mock<ClientFriendlyStatusRepository>();
      mockClientFriendlyStatusRepository.findById.mockReturnValueOnce(null);

      const mockClientFriendlyStatusDtoMapper = mock<ClientFriendlyStatusDtoMapper>();

      const service = new ClientFriendlyStatusServiceImpl(mockLogFactory, mockClientFriendlyStatusDtoMapper, mockClientFriendlyStatusRepository, mockServerConfig);

      const dto = service.findById(id);

      expect(dto).toEqual(null);
      expect(mockClientFriendlyStatusRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockClientFriendlyStatusDtoMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto).not.toHaveBeenCalled();
    });
  });
});

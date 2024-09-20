import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ClientFriendlyStatusDto } from '~/.server/domain/dtos';
import type { ClientFriendlyStatusEntity } from '~/.server/domain/entities/client-friendly-status.entity';
import { ClientFriendlyStatusDtoMapperImpl } from '~/.server/domain/mappers';

describe('ClientFriendlyStatusDtoMapperImpl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('mapClientFriendlyStatusEntityToClientFriendlyStatusDto', () => {
    it('maps a ClientFriendlyStatusEntity with both English and French labels to a ClientFriendlyStatusDto', () => {
      const mockEntity: ClientFriendlyStatusEntity = {
        esdc_clientfriendlystatusid: '1',
        esdc_descriptionenglish: 'You have qualified for the Canadian Dental Care Plan.',
        esdc_descriptionfrench: 'Vous êtes admissible au Régime canadien de soins dentaires.',
      };

      const expectedDto: ClientFriendlyStatusDto = {
        id: '1',
        nameEn: 'You have qualified for the Canadian Dental Care Plan.',
        nameFr: 'Vous êtes admissible au Régime canadien de soins dentaires.',
      };

      const mapper = new ClientFriendlyStatusDtoMapperImpl();

      const dto = mapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(mockEntity);

      expect(dto).toEqual(expectedDto);
    });
  });

  describe('mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos', () => {
    it('maps an array of ClientFriendlyStatusEntities to an array of ClientFriendlyStatusDtos', () => {
      const mockEntities: ClientFriendlyStatusEntity[] = [
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
      ];

      const expectedDtos: ClientFriendlyStatusDto[] = [
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

      const mapper = new ClientFriendlyStatusDtoMapperImpl();

      const dtos = mapper.mapClientFriendlyStatusEntitiesToClientFriendlyStatusDtos(mockEntities);

      expect(dtos).toEqual(expectedDtos);
    });
  });
});

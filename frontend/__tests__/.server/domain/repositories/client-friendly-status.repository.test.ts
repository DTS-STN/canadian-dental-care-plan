import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultClientFriendlyStatusRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
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
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/client-friendly-status.json', () => dataSource);

describe('DefaultClientFriendlyStatusRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all client friendly statuses', () => {
    const repository = new DefaultClientFriendlyStatusRepository();

    const clientFriendlyStatuses = repository.listAllClientFriendlyStatuses();

    expect(clientFriendlyStatuses).toEqual([
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
  });

  it('should handle empty client friendly statuses data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new DefaultClientFriendlyStatusRepository();

    const clientFriendlyStatuses = repository.listAllClientFriendlyStatuses();

    expect(clientFriendlyStatuses).toEqual([]);
  });

  it('should get a client friendly status by id', () => {
    const repository = new DefaultClientFriendlyStatusRepository();

    const clientFriendlyStatus = repository.findClientFriendlyStatusById('1');

    expect(clientFriendlyStatus).toEqual({
      esdc_clientfriendlystatusid: '1',
      esdc_descriptionenglish: 'You have qualified for the Canadian Dental Care Plan.',
      esdc_descriptionfrench: 'Vous êtes admissible au Régime canadien de soins dentaires.',
    });
  });

  it('should return null for non-existent client friendly status id', () => {
    const repository = new DefaultClientFriendlyStatusRepository();

    const clientFriendlyStatus = repository.findClientFriendlyStatusById('non-existent-id');

    expect(clientFriendlyStatus).toBeNull();
  });
});

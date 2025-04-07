import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultMaritalStatusRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        OptionSet: {
          Options: [
            {
              Value: 1,
              Label: {
                LocalizedLabels: [
                  {
                    Label: 'Single',
                    LanguageCode: 1033,
                  },
                  {
                    Label: 'Célibataire',
                    LanguageCode: 1036,
                  },
                ],
              },
            },
            {
              Value: 2,
              Label: {
                LocalizedLabels: [
                  {
                    Label: 'Married',
                    LanguageCode: 1033,
                  },
                  {
                    Label: 'Marié(e)',
                    LanguageCode: 1036,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/marital-status.json', () => dataSource);

describe('DefaultMaritalStatusRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all marital statuses', () => {
    const repository = new DefaultMaritalStatusRepository();

    const maritalStatuses = repository.listAllMaritalStatuses();

    expect(maritalStatuses).toEqual([
      {
        Value: 1,
        Label: {
          LocalizedLabels: [
            {
              Label: 'Single',
              LanguageCode: 1033,
            },
            {
              Label: 'Célibataire',
              LanguageCode: 1036,
            },
          ],
        },
      },
      {
        Value: 2,
        Label: {
          LocalizedLabels: [
            {
              Label: 'Married',
              LanguageCode: 1033,
            },
            {
              Label: 'Marié(e)',
              LanguageCode: 1036,
            },
          ],
        },
      },
    ]);
  });

  it('should handle empty marital statuses data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new DefaultMaritalStatusRepository();

    const maritalStatuses = repository.listAllMaritalStatuses();

    expect(maritalStatuses).toEqual([]);
  });

  it('should get a marital status by id', () => {
    const repository = new DefaultMaritalStatusRepository();

    const maritalStatus = repository.findMaritalStatusById('1');

    expect(maritalStatus).toEqual({
      Value: 1,
      Label: {
        LocalizedLabels: [
          {
            Label: 'Single',
            LanguageCode: 1033,
          },
          {
            Label: 'Célibataire',
            LanguageCode: 1036,
          },
        ],
      },
    });
  });

  it('should return null for non-existent marital status id', () => {
    const repository = new DefaultMaritalStatusRepository();

    const maritalStatus = repository.findMaritalStatusById('non-existent-id');

    expect(maritalStatus).toBeNull();
  });
});

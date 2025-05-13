import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultPreferredCommunicationMethodRepository, MockPreferredCommunicationMethodRepository } from '~/.server/domain/repositories';

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
                    Label: 'Email',
                    LanguageCode: 1033,
                  },
                  {
                    Label: 'Courriel',
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
                    Label: 'Mail',
                    LanguageCode: 1033,
                  },
                  {
                    Label: 'Courrier',
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

vi.mock('~/.server/resources/power-platform/preferred-communication-method.json', () => dataSource);

describe('DefaultPreferredCommunicationMethodRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllPreferredCommunicationMethods call', () => {
    const repository = new DefaultPreferredCommunicationMethodRepository();

    expect(() => repository.listAllPreferredCommunicationMethods()).toThrowError('Preferred communication method service is not yet implemented');
  });

  it('should throw error on findPreferredCommunicationMethodById call', () => {
    const repository = new DefaultPreferredCommunicationMethodRepository();

    expect(() => repository.findPreferredCommunicationMethodById('1')).toThrowError('Preferred communication method service is not yet implemented');
  });
});

describe('MockPreferredCommunicationMethodRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all preferred communication methods', () => {
    const repository = new MockPreferredCommunicationMethodRepository();

    const preferredCommunicationMethods = repository.listAllPreferredCommunicationMethods();

    expect(preferredCommunicationMethods).toEqual([
      {
        Value: 1,
        Label: {
          LocalizedLabels: [
            {
              Label: 'Email',
              LanguageCode: 1033,
            },
            {
              Label: 'Courriel',
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
              Label: 'Mail',
              LanguageCode: 1033,
            },
            {
              Label: 'Courrier',
              LanguageCode: 1036,
            },
          ],
        },
      },
    ]);
  });

  it('should handle empty preferred communication methods data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockPreferredCommunicationMethodRepository();

    const preferredCommunicationMethods = repository.listAllPreferredCommunicationMethods();

    expect(preferredCommunicationMethods).toEqual([]);
  });

  it('should get a preferred communication method by id', () => {
    const repository = new MockPreferredCommunicationMethodRepository();

    const preferredCommunicationMethod = repository.findPreferredCommunicationMethodById('1');

    expect(preferredCommunicationMethod).toEqual({
      Value: 1,
      Label: {
        LocalizedLabels: [
          {
            Label: 'Email',
            LanguageCode: 1033,
          },
          {
            Label: 'Courriel',
            LanguageCode: 1036,
          },
        ],
      },
    });
  });

  it('should return null for non-existent preferred communication method id', () => {
    const repository = new MockPreferredCommunicationMethodRepository();

    const preferredCommunicationMethod = repository.findPreferredCommunicationMethodById('non-existent-id');

    expect(preferredCommunicationMethod).toBeNull();
  });
});

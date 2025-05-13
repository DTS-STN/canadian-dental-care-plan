import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultPreferredLanguageRepository, MockPreferredLanguageRepository } from '~/.server/domain/repositories';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        OptionSet: {
          Options: [
            {
              Value: 1033,
              Label: {
                LocalizedLabels: [
                  { Label: 'English', LanguageCode: 1033 },
                  { Label: 'Anglais', LanguageCode: 1036 },
                ],
              },
            },
            {
              Value: 1036,
              Label: {
                LocalizedLabels: [
                  { Label: 'French', LanguageCode: 1033 },
                  { Label: 'Français', LanguageCode: 1036 },
                ],
              },
            },
          ],
        },
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/preferred-language.json', () => dataSource);

describe('DefaultPreferredLanguageRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllPreferredLanguages call', () => {
    const repository = new DefaultPreferredLanguageRepository();

    expect(() => repository.listAllPreferredLanguages()).toThrowError('Preferred language service is not yet implemented');
  });

  it('should throw error on findPreferredLanguageById call', () => {
    const repository = new DefaultPreferredLanguageRepository();

    expect(() => repository.findPreferredLanguageById('1033')).toThrowError('Preferred language service is not yet implemented');
  });
});

describe('MockPreferredLanguageRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all preferred languages', () => {
    const repository = new MockPreferredLanguageRepository();

    const preferredLanguages = repository.listAllPreferredLanguages();

    expect(preferredLanguages).toEqual([
      {
        Value: 1033,
        Label: {
          LocalizedLabels: [
            { Label: 'English', LanguageCode: 1033 },
            { Label: 'Anglais', LanguageCode: 1036 },
          ],
        },
      },
      {
        Value: 1036,
        Label: {
          LocalizedLabels: [
            { Label: 'French', LanguageCode: 1033 },
            { Label: 'Français', LanguageCode: 1036 },
          ],
        },
      },
    ]);
  });

  it('should handle empty preferred languages data', () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({
      value: [],
    });

    const repository = new MockPreferredLanguageRepository();

    const preferredLanguages = repository.listAllPreferredLanguages();

    expect(preferredLanguages).toEqual([]);
  });

  it('should get a preferred language by id', () => {
    const repository = new MockPreferredLanguageRepository();

    const preferredLanguage = repository.findPreferredLanguageById('1033');

    expect(preferredLanguage).toEqual({
      Value: 1033,
      Label: {
        LocalizedLabels: [
          {
            Label: 'English',
            LanguageCode: 1033,
          },
          {
            Label: 'Anglais',
            LanguageCode: 1036,
          },
        ],
      },
    });
  });

  it('should return null for non-existent preferred language id', () => {
    const repository = new MockPreferredLanguageRepository();

    const preferredLanguage = repository.findPreferredLanguageById('non-existent-id');

    expect(preferredLanguage).toBeNull();
  });
});

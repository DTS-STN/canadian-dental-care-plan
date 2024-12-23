import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { DefaultPreferredLanguageRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

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

  it('should get all preferred languages', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new DefaultPreferredLanguageRepository(mockLogFactory);

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

    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new DefaultPreferredLanguageRepository(mockLogFactory);

    const preferredLanguages = repository.listAllPreferredLanguages();

    expect(preferredLanguages).toEqual([]);
  });

  it('should get a preferred language by id', () => {
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new DefaultPreferredLanguageRepository(mockLogFactory);

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
    const mockLogFactory = mock<LogFactory>();
    mockLogFactory.createLogger.mockReturnValue(mock<Logger>());

    const repository = new DefaultPreferredLanguageRepository(mockLogFactory);

    const preferredLanguage = repository.findPreferredLanguageById('non-existent-id');

    expect(preferredLanguage).toBeNull();
  });
});

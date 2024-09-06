import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';
import { ContainerServiceProviderImpl } from '~/.server/providers/container-service.provider';

describe('ContainerServiceProviderImpl', () => {
  it('should inject preferred language service', () => {
    const mockPreferredLanguageService = mock<PreferredLanguageService>();
    const containerProvider = new ContainerServiceProviderImpl(mockPreferredLanguageService);

    expect(containerProvider.preferredLanguage).toBe(mockPreferredLanguageService);
  });
});

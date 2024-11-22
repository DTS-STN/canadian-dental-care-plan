import * as fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readBuildInfo } from '~/.server/utils/build-info.utils';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('readBuildInfo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined if the file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(readBuildInfo('build-info.json')).toBeNull();
  });

  it('should return a BuildInfo object if the file exists', () => {
    const expectedBuildInfo = {
      buildDate: '2000-01-01T00:00:00Z',
      buildId: '0000',
      buildRevision: '00000000',
      buildVersion: '0.0.0-00000000-0000',
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(expectedBuildInfo));

    expect(readBuildInfo('build-info.json')).toEqual(expectedBuildInfo);
  });
});

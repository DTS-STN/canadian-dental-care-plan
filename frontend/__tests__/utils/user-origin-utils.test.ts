import { useRouteLoaderData } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserOrigin } from '~/utils/user-origin-utils';

vi.mock('@remix-run/react');
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

describe('useUserOrigin', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return undefined if no data is returned from the root loader', () => {
    vi.mocked(useRouteLoaderData);
    expect(useUserOrigin()).toEqual(undefined);
  });

  it('should return user origin from MSCA', () => {
    vi.mocked(useRouteLoaderData).mockReturnValue({
      userOrigin: 'msca',
      env: 'msca',
    });
    expect(useUserOrigin()).toEqual({
      to: 'gcweb:header.menu-msca-home.href',
      text: 'gcweb:header.menu-dashboard.text',
      isFromMSCAD: false,
    });
  });

  it('should return user origin from MSCA-D', () => {
    vi.mocked(useRouteLoaderData).mockReturnValue({
      userOrigin: 'msca-d',
      env: 'msca-d',
    });
    expect(useUserOrigin()).toEqual({
      to: 'gcweb:header.menu-dashboard.href',
      text: 'gcweb:header.menu-dashboard.text',
      isFromMSCAD: true,
    });
  });

  it('should throw an error for origins that are not msca or msca-d', () => {
    vi.mocked(useRouteLoaderData).mockReturnValue({
      userOrigin: 'not-msca-or-msca-d',
      env: 'not-msca-or-msca-d',
    });
    expect(() => useUserOrigin()).toThrowError();
  });
});

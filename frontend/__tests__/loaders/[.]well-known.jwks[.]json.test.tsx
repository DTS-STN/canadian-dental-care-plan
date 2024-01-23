import { describe, expect, it } from 'vitest';

import { loader } from '~/routes/[.]well-known.jwks[.]json';
import { getEnv } from '~/utils/env.server';

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn(),
}));

describe('/.well-known/jwks.json', () => {
  it('should return an empty set of keys if AUTH_JWT_PUBLIC_KEY is not defined', async () => {
    vi.mocked(getEnv, { partial: true }).mockReturnValue({
      AUTH_JWT_PUBLIC_KEY: undefined,
    });

    const response = loader({
      request: new Request('http://localhost:3000/.well-known/jwks.json'),
      context: {},
      params: {},
    });

    const data = await response.json();

    expect(data).toEqual({ keys: [] });
  });

  it('should return an expected set of keys if AUTH_JWT_PUBLIC_KEY is defined', async () => {
    vi.mocked(getEnv, { partial: true }).mockReturnValue({
      AUTH_JWT_PUBLIC_KEY:
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0H5/WxqSoFDn0C8Ll02e' +
        'YOjtmtoQBBb092efY/qOT61Df8RbELMe7bf/IbhHMpnCDznquXO4kloqyBMiyrR5' +
        '1xmHaxk5kJk25j+JyDp3iOyyWJLPyrMEhHFsYU3FfJwS/wGfSVX/tO7QMlet2Oek' +
        'HXL2mjNc4N4jsDz/fBWTyJXbHHdRxiQvqCJ2GRWE3DVX93KcqIdvBFsFr3wKLjLp' +
        'qlv9r91YAieazGD0ns5vsK3GrhCh6okNHUSiB4Jn5QMvusQU0c5cHcaJXyC+6eTz' +
        'Kw3Ns7IfQyQyW1VPxzxi8ln0viMDRii/0t3wovO1INTi6u8IiY6d0xXa5SWiJYaE' +
        'RQIDAQAB',
    });

    const response = loader({
      request: new Request('http://localhost:3000/.well-known/jwks.json'),
      context: {},
      params: {},
    });

    const data = await response.json();

    expect(data).toEqual({
      keys: [
        {
          use: 'sig',
          kid: '15aa2634535ac6bc6664e2ef5839df2e',
          kty: 'RSA',
          n: '0H5_WxqSoFDn0C8Ll02eYOjtmtoQBBb092efY_qOT61Df8RbELMe7bf_IbhHMpnCDznquXO4kloqyBMiyrR51xmHaxk5kJk25j-JyDp3iOyyWJLPyrMEhHFsYU3FfJwS_wGfSVX_tO7QMlet2OekHXL2mjNc4N4jsDz_fBWTyJXbHHdRxiQvqCJ2GRWE3DVX93KcqIdvBFsFr3wKLjLpqlv9r91YAieazGD0ns5vsK3GrhCh6okNHUSiB4Jn5QMvusQU0c5cHcaJXyC-6eTzKw3Ns7IfQyQyW1VPxzxi8ln0viMDRii_0t3wovO1INTi6u8IiY6d0xXa5SWiJYaERQ',
          e: 'AQAB',
        },
      ],
    });
  });
});

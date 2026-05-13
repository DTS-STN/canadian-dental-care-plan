import { useCallback, useRef } from 'react';

import type HCaptcha from '@hcaptcha/react-hcaptcha';

import { useClientEnv } from '~/root';

export function useHCaptcha() {
  const { HCAPTCHA_SITE_KEY: sitekey } = useClientEnv();
  const captchaRef = useRef<HCaptcha>(null);

  const onLoad = useCallback(() => {
    captchaRef.current?.execute();
  }, []);

  return { captchaRef, onLoad, sitekey };
}

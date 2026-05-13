import { useCallback, useRef } from 'react';

import type HCaptcha from '@hcaptcha/react-hcaptcha';

export function useHCaptcha() {
  const captchaRef = useRef<HCaptcha>(null);

  const onLoad = useCallback(() => {
    captchaRef.current?.execute();
  }, []);

  return { captchaRef, onLoad };
}

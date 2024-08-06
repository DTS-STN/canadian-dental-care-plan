import { useEffect, useRef } from 'react';

import type HCaptcha from '@hcaptcha/react-hcaptcha';

export function useHCaptcha() {
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (captchaRef.current?.isReady()) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      captchaRef.current.execute();
    } else {
      timeoutId = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        captchaRef.current?.execute();
      }, 500);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return { captchaRef };
}

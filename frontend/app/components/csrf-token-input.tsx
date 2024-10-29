import type { ComponentPropsWithoutRef } from 'react';

import { useCsrfToken } from '~/root';

interface CsrfTokenInputProps extends Pick<ComponentPropsWithoutRef<'input'>, 'name' | 'id' | 'className'> {
  'data-testid'?: string;
}

export function CsrfTokenInput(props: CsrfTokenInputProps) {
  const csrfToken = useCsrfToken();
  return <input type="hidden" name="_csrf" value={csrfToken} data-testid="csrf-token-input" {...props} />;
}

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { afterEach, vi } from 'vitest';

vi.mock('react-i18next');
vi.mock('~/.server/logging');

afterEach(() => {
  cleanup();
});

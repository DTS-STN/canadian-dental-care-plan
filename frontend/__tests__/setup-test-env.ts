// require by inversify to be the first import
import 'reflect-metadata';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { afterEach } from 'vitest';

/**
 * Jest has their globals API enabled by default. Vitest does not. We can either enable globals via the globals
 * configuration setting or update your code to use imports from the vitest module instead.
 *
 * We decided to keep globals disabled.
 * @see https://vitest.dev/guide/migration.html#globals-as-a-default
 */
afterEach(() => {
  cleanup();
});

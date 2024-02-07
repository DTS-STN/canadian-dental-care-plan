import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { JSDOM } from 'jsdom';
import { afterEach } from 'vitest';

// Workaround: For some reason FormData is not set to jsdom's by default
const jsdom = new JSDOM(`<!doctype html>`);
const { FormData } = jsdom.window;
window.FormData = FormData;
global.FormData = FormData;

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

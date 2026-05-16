import { defineConfig } from 'i18next-cli';
import { kebabCase } from 'moderndash';

export default defineConfig({
  locales: ['en', 'fr'],
  extract: {
    defaultNS: 'common',
    input: './app/**/*.{js,jsx,ts,tsx}',
    output: (language, namespace) => `./app/.server/locales/${language}/${kebabCase(namespace ?? '')}.ts`,
  },
});

import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en', 'fr'],
  extract: {
    input: './app/**/*.{js,jsx,ts,tsx}',
    output: './app/.server/locales/{{language}}/{{namespace}}.json',
  },
});

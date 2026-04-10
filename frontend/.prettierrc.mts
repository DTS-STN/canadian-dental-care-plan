import { type Config } from 'prettier';

// Prettier configuration
// @see https://prettier.io/docs/configuration
const config: Config = {
  semi: true,
  tabWidth: 2,
  singleQuote: true,
  printWidth: 256,
  importOrder: ['^react(-dom/.*)?$', '^@testing-library/(.*)$', '^[@]?react-router(/.*)?', '<THIRD_PARTY_MODULES>', '^[\\.]', '^[~]'],
  // @trivago/prettier-plugin-sort-imports options
  // @see https://github.com/trivago/prettier-plugin-sort-imports
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
};

export default config;

import { type Config } from 'prettier';

// Prettier configuration
// @see https://prettier.io/docs/configuration
const config: Config = {
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  printWidth: 256,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  // @trivago/prettier-plugin-sort-imports options
  // @see https://github.com/trivago/prettier-plugin-sort-imports
  importOrder: ['^react(-dom/.*)?$', '^@testing-library/(.*)$', '^[@]?react-router(/.*)?', '<THIRD_PARTY_MODULES>', '^[\\.]', '^[~]'],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default config;

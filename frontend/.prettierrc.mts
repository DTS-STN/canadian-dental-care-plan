import { type Config } from 'prettier';

// Prettier configuration
// @see https://prettier.io/docs/configuration
const config: Config = {
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    // Compatibility with other Prettier plugins
    // @see https://github.com/tailwindlabs/prettier-plugin-tailwindcss?tab=readme-ov-file#compatibility-with-other-prettier-plugins
    'prettier-plugin-tailwindcss',
  ],
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
  // prettier-plugin-tailwindcss options
  // @see https://github.com/tailwindlabs/prettier-plugin-tailwindcss#options
  tailwindFunctions: ['clsx', 'cn', 'cva'],
};

export default config;

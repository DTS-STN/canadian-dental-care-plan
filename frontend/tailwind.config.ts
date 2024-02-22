import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    // @see https://wet-boew.github.io/wet-boew-styleguide/design/grids-en.html#responsive
    screens: {
      sm: '768px',
      md: '992px',
      lg: '1200px',
    },
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    fontFamily: {
      lato: ['"Lato"', 'sans-serif'],
      sans: ['"Noto Sans"', 'sans-serif'],
    },
    // @see https://wet-boew.github.io/wet-boew-styleguide/design/grids-en.html#responsive
    screens: {
      sm: '768px',
      md: '992px',
      lg: '1200px',
      print: { raw: 'print' },
      screen: { raw: 'screen' },
    },
    extend: {
      backgroundImage: () => ({
        'splash-page': 'url(/assets/sp-bg-1.e0bf1ea7.jpg)',
      }),
    },
  },
  plugins: [animate],
} satisfies Config;

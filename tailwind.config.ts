import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          50: '#e8f3ec',
          100: '#c9e2d2',
          400: '#3a8a5b',
          500: '#1f6e43',
          600: '#155835',
          700: '#0f4127',
          900: '#062417',
        },
        ink: {
          900: '#0b0f14',
          800: '#121822',
          700: '#1a2230',
          600: '#293345',
          500: '#3b4661',
          400: '#5a6685',
          300: '#8995b3',
          200: '#c2c9dd',
          100: '#e6e9f3',
        },
        accent: {
          gold: '#e7b84b',
          rose: '#e05d6a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
        card: '0 4px 12px rgba(2, 23, 14, 0.18), 0 1px 2px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 240ms ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

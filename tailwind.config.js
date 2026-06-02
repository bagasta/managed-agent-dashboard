/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          900: '#1d1d1f',
          700: '#424245',
          500: '#6e6e73',
          400: '#86868b',
          300: '#aeaeb2',
          200: '#d2d2d7',
          100: '#e8e8ed',
          50: '#fbfbfd',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0071e3',
          700: '#0058b9',
          900: '#0a2540',
        },
        accent: '#0071e3',
      },
    },
  },
  plugins: [],
}

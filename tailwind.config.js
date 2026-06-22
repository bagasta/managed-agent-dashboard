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
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        'card-hover': '0 2px 4px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.10)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.5s infinite' },
    },
  },
  plugins: [],
}

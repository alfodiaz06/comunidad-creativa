/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Syne"', 'sans-serif'],
        'body': ['"DM Sans"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#080706',
          900: '#0f0e0c',
          800: '#161512',
          700: '#1e1c18',
          600: '#272420',
          500: '#332f28',
        },
        brand: {
          300: '#ffb347',
          400: '#ff9500',
          500: '#ff7c00',
          600: '#e06500',
        },
        accent: {
          300: '#6ba3ff',
          400: '#3d82ff',
          500: '#1a64ff',
          600: '#0047e0',
        },
        jade: {
          300: '#6ef5be',
          400: '#2ee89a',
          500: '#00d68f',
        },
        ember: {
          300: '#ffa07a',
          400: '#ff7043',
          500: '#f4511e',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' }
    },
  },
  plugins: [],
}

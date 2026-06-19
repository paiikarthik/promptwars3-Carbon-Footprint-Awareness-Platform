/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eco: {
          bg: {
            dark: '#080d0a',
            card: 'rgba(16, 28, 21, 0.65)',
            input: 'rgba(25, 41, 31, 0.8)',
          },
          accent: {
            green: '#10b981',    # Emerald
            mint: '#34d399',     # Mint
            cyan: '#06b6d4',     # Cyan
            yellow: '#fbbf24',   # Warning
            red: '#f87171'       # High carbon
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

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
        background: '#0B0F19',
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          card: 'rgba(17, 24, 39, 0.75)',
        },
        primary: {
          DEFAULT: '#00F0FF',
          dark: '#00B8D4',
          glow: 'rgba(0, 240, 255, 0.35)',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        accent: {
          DEFAULT: '#F43F5E',
          glow: 'rgba(244, 63, 94, 0.35)',
        },
        target: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.5)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'target-beacon': 'targetBeacon 1.5s ease-in-out infinite alternate',
        'shake': 'shake 0.4s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.6))' },
          '50%': { opacity: '.8', filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.2))' },
        },
        targetBeacon: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 20px 4px rgba(245, 158, 11, 0.4)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        }
      }
    },
  },
  plugins: [],
}

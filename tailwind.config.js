/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          50: '#F8F9FA',
          100: '#F1F5F9',
          200: '#EAECEF',
          300: '#d4d4d8',
          400: '#94A3B8',
          500: '#64748B',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#111111',
          950: '#111111',
        },
        accent: {
          amber: '#f59e0b',
          emerald: '#10b981',
          emeraldDark: '#059669',
          amberDark: '#d97706',
        },
        app: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          border: '#EAECEF',
          dark: '#111111',
        },
        amber: {
          glow: '#FEF3C7',
          accent: '#D97706',
        },
        emerald: {
          glow: '#D1FAE5',
          accent: '#059669',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        widestPlus: '0.18em',
      },
      boxShadow: {
        apple: '0 2px 10px rgba(0, 0, 0, 0.02)',
        'apple-float': '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
        'apple-dock': '0 12px 40px -10px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.02)',
        bento: '0 2px 10px rgba(0, 0, 0, 0.02)',
        'bento-hover': '0 8px 24px rgba(0, 0, 0, 0.04)',
        keycap: '0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'timer-glow-amber': '0 0 35px rgba(217, 119, 6, 0.15)',
        'timer-glow-emerald': '0 0 35px rgba(5, 150, 105, 0.18)',
      },
      borderRadius: {
        'bento': '24px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#38bdf8',
          dark: '#0ea5e9',
          muted: 'rgba(56, 189, 248, 0.12)',
        },
        success: {
          DEFAULT: '#34d399',
        },
        warning: {
          DEFAULT: '#fbbf24',
        },
        danger: {
          DEFAULT: '#f87171',
        },
        bg: {
          primary: '#070b12',
          secondary: '#0c1018',
          tertiary: '#111827',
          card: '#121826',
          elevated: '#161d2a',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        border: {
          DEFAULT: '#1e293b',
          subtle: 'rgba(148, 163, 184, 0.08)',
          focus: 'rgba(56, 189, 248, 0.45)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        panel:
          '0 1px 0 0 rgba(255, 255, 255, 0.04) inset, 0 8px 32px -8px rgba(0, 0, 0, 0.5)',
        'panel-sm':
          '0 1px 0 0 rgba(255, 255, 255, 0.03) inset, 0 4px 16px -4px rgba(0, 0, 0, 0.35)',
        'glow-primary': '0 0 32px -6px rgba(56, 189, 248, 0.22)',
        'glow-success': '0 0 20px -4px rgba(52, 211, 153, 0.25)',
      },
      transitionDuration: {
        250: '250ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out forwards',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

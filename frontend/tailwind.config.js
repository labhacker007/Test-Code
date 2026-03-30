/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00d4ff',
          dark: '#0088aa',
        },
        success: '#00ff88',
        warning: '#ffcc00',
        danger: '#ff3366',
        bg: {
          primary: '#0a0e1a',
          secondary: '#141824',
          card: '#1a1f2e',
        },
        text: {
          primary: '#e8ecf5',
          secondary: '#8b95b0',
        },
        border: '#2a3144',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          surface: 'var(--color-paper-surface)',
          sunken: 'var(--color-paper-sunken)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          foreground: '#FFFDF8',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: '#1B1B1B',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        semantic: {
          positive: '#2F7D4F',
          warning: '#B7791F',
          danger: '#B3382C',
          info: '#2B6CB0',
        },
      },
      borderRadius: {
        control: '6px',
        panel: '8px',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        panelAlt: 'rgb(var(--panel-alt) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accentSoft: 'rgb(var(--accent-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 50px -24px rgba(0, 0, 0, 0.85)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(124, 242, 154, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 242, 154, 0.08) 1px, transparent 1px)',
      },
      keyframes: {
        pulseLine: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        pulseLine: 'pulseLine 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

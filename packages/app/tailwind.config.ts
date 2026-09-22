import type { Config } from 'tailwindcss';

// Component styles live in src/app/release-console.css; Tailwind supplies the reset and
// the odd utility, themed from the same design-system tokens.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        panel: 'var(--bg-panel)',
        foreground: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        border: 'var(--border-subtle)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warn)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;

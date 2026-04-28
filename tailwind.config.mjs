/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

  theme: {
    extend: {
      colors: {
        base: '#0a0a0a',
        surface: '#111111',
        elevated: '#1a1a1a',
        border: '#2a2a2a',
        primary: '#f0f0f0',
        secondary: '#888888',
        'accent-green': '#22c55e',
        'accent-yellow': '#eab308',
        'accent-red': '#ef4444',
        'accent-blue': '#3b82f6',
        'accent-purple': '#a855f7',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Geist', 'Inter', 'system-ui'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
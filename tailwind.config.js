/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Work Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        paper: '#fbf6ec',
        'paper-deep': '#f3ead8',
        ink: '#1f1813',
        'ink-body': '#5a4a3e',
        muted: '#8a7a6b',
        rule: '#e6dac1',
        terra: '#b8391a',
        'terra-deep': '#8a2810',
        ochre: '#c48b3a',
      },
    },
  },
  plugins: [],
}

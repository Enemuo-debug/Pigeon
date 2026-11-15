/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        heading: ['Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
        story: ['Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#06080b',
          900: '#0b0f14',
          850: '#10161f',
          800: '#161e2a',
          700: '#222f42',
        }
      }
    },
  },
  plugins: [],
}

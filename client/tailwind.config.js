/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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

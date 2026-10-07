/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krones: {
          navy: '#003366',
          blue: '#0066B2',
          ice: '#E6EFF7',
          hover: '#00254D',
          bg: '#F4F6F9',
          white: '#FFFFFF',
        },
        diff: {
          correct: '#10B981',
          missing: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Univers', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}

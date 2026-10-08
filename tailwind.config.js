/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ffYellow: '#FFB800',
        ffRed: '#E53E3E',
        ffDark: '#0A0C10',
        ffCard: '#121620'
      }
    },
  },
  plugins: [],
}

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
          DEFAULT: '#800000', // Maroon
          light: '#A52A2A',
        },
        secondary: {
          DEFAULT: '#ffcc00', // Gold
        },
        background: '#fff8e7', // Cream
      }
    },
  },
  plugins: [],
}

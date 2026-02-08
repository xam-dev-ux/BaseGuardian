/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-blue': '#0052FF',
        'base-dark': '#0A0B0D',
        'base-gray': '#1E2025',
      },
    },
  },
  plugins: [],
}

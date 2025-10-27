/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xhs-red': '#FE2C55',
        'beige': '#F5E6D3',
        'beige-light': '#FAF5F0',
      }
    },
  },
  plugins: [],
}


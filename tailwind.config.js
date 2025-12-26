/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#09090b',
          green: '#10b981',
          border: '#27272a'
        }
      }
    },
  },
  plugins: [],
}
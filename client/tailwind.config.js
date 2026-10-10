/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: '#0B0F19', // Deep dark for NOC feel
        card: '#1A2234',
        neonGreen: '#39FF14',
        neonYellow: '#FCE205',
        neonRed: '#FF3131',
      }
    },
  },
  plugins: [],
}

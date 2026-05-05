/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0a',
          card: '#111113',
          elev: '#17171a',
        },
        brand: {
          DEFAULT: '#a855f7',
          accent: '#22d3ee',
        },
      },
    },
  },
  plugins: [],
};

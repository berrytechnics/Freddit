/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'reddit-orange': '#FF4500',
        'reddit-blue': '#0079D3',
        'reddit-gray': '#DAE0E6',
        'reddit-dark': '#1A1A1B',
      },
    },
  },
  plugins: [],
};

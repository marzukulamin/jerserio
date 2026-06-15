/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:       '#00d4aa',
        'accent-dim': '#009e7f',
        'bg-primary':   '#040407',
        'bg-secondary': '#0a0a10',
        'bg-card':      '#0e0e16',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

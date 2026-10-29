/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07111f',
          900: '#0b1628',
          800: '#13233c',
          700: '#243b5d',
          200: '#d8e3f0',
        },
        sand: '#f5efe4',
        ember: '#ff7a59',
        sky: '#48b7ff',
        mint: '#2ad2c9',
      },
      boxShadow: {
        glass: '0 20px 60px rgba(4, 10, 24, 0.18)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top left, rgba(72, 183, 255, 0.3), transparent 28%), radial-gradient(circle at right top, rgba(255, 122, 89, 0.22), transparent 24%), linear-gradient(180deg, rgba(7,17,31,0.96), rgba(11,22,40,1))',
      },
    },
  },
  plugins: [],
};

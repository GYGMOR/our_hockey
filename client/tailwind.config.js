/** Tailwind: hier definieren wir unsere eigenen Farben für den Sport-Look. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#07090f', 900: '#0c111b', 800: '#131a27', 700: '#1c2536', 600: '#2a3549', 400: '#7d8aa3', 300: '#a9b4c8' },
        accent: { DEFAULT: '#ff4d2e', soft: '#ff4d2e22' },
        live: '#ff2d55',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

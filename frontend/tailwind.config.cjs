// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      animation: {
        bounceSlow: 'bounce 1.5s infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "Avenir Next", "Segoe UI", "sans-serif"],
        sans: [
          "Noto Sans",
          "Segoe UI",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: ["IBM Plex Mono", "ui-monospace", "Consolas", "monospace"],
      },
      colors: {
        copper: "#e4a574",
        ice: "#9fd6d1",
      },
    },
  },
  plugins: [],
};

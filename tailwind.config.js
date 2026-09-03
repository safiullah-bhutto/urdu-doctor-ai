/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#0B4F3F",
          dark: "#083A2E",
          light: "#146854",
        },
        ivory: "#F3F6F2",
        amber: {
          DEFAULT: "#E0A458",
          dark: "#C4863A",
        },
        charcoal: "#1B2420",
        alert: "#C0392B",
      },
      fontFamily: {
        nastaliq: ["'Noto Nastaliq Urdu'", "serif"],
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "lexus-bg": "#020712",
        "lexus-surface": "#081326",
        "lexus-surface-2": "#0d1b33",
        "lexus-border": "rgba(107, 91, 255, 0.28)",
        "lexus-blue": "#6B5BFF",
        "lexus-green": "#00D084",
        "lexus-amber": "#F5A623",
        "lexus-red": "#FF6B6B",
      },
    },
  },
  plugins: [],
};

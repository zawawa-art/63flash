/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neonPink: "#ff2ee0",
        neonPurple: "#8b2eff",
        neonGold: "#ffd23f",
        bgDark: "#0a0518",
      },
      boxShadow: {
        neon: "0 0 10px #ff2ee0, 0 0 20px #8b2eff",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0c0f",
        card: "#0d0f14",
        border: "#1e2128",
        primary: "#10b981", // Emerald
        secondary: "#f59e0b", // Amber
        accent: "#3b82f6", // Blue
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

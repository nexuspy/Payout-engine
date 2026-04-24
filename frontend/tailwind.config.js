/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-deep': '#00361a',
        'forest-base': '#1a4d2e',
        'emerald-vibrant': '#006d36',
        'emerald-light': '#4ade80',
        'emerald-glow': '#6dfe9c',
        'neutral-bg': '#f7faf9',
        'neutral-well': '#ebeeed',
        'neutral-pop': '#ffffff',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'hero': ['Plus Jakarta Sans', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '4rem',
      },
      boxShadow: {
        'organic': '0 10px 40px -10px rgba(29, 80, 49, 0.05)',
        'organic-lg': '0 20px 60px -15px rgba(29, 80, 49, 0.08)',
      }
    },
  },
  plugins: [],
}

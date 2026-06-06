/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',     // Slate 900
          card: '#1e293b',     // Slate 800
          border: '#334155',   // Slate 700
          accent: '#f97316',   // Orange 500 (Vibrant Moto orange)
          hover: '#ea580c',    // Orange 600
          text: '#f8fafc',     // Slate 50
          muted: '#94a3b8'     // Slate 400
        }
      }
    },
  },
  plugins: [],
}

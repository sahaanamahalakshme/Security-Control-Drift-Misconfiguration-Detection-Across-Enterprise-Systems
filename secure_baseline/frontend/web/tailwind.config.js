/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        card: '#FFFFFF',
        primary: '#1B7B6F',
        success: '#2ECC71',
        warning: '#F39C12',
        critical: '#E74C3C',
        textPrimary: '#2C3E50',
        textSecondary: '#7F8C8D',
        borderLight: '#ECF0F1',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

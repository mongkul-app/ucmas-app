/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0b1220',
          900: '#0f1a2e',
          800: '#152238',
          700: '#1c2c47',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec4ff',
          400: '#59a3ff',
          500: '#3182f6',
          600: '#1f63e0',
          700: '#1a4fb5',
          800: '#1a4291',
          900: '#1b3873',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
        cardLg: '0 4px 12px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0ff',
          300: '#7cc2ff',
          400: '#369eff',
          500: '#0077ff', // Vibrant Primary
          600: '#005be6', // Interactive
          700: '#0047cc',
          800: '#003db3',
          900: '#00358f',
          950: '#002159',
        },
        slate: {
          850: '#151e2e', // Custom dark depth
          900: '#0f172a',
          950: '#020617',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out 4s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-15px)' } }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow-brand': '0 0 60px -15px rgba(0, 119, 255, 0.3)',
      }
    },
  },
  plugins: [],
}

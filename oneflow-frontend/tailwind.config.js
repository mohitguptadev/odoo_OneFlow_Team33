/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'flicker': 'flicker 0.3s ease-in-out',
        'particle-fade': 'particleFade 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-in',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '10%': { opacity: '0.8', transform: 'scale(0.98)' },
          '20%': { opacity: '1', transform: 'scale(1.02)' },
          '30%': { opacity: '0.9', transform: 'scale(0.99)' },
          '40%': { opacity: '1', transform: 'scale(1.01)' },
          '50%': { opacity: '0.85', transform: 'scale(0.97)' },
          '60%': { opacity: '1', transform: 'scale(1)' },
          '70%': { opacity: '0.9', transform: 'scale(1.01)' },
          '80%': { opacity: '1', transform: 'scale(0.99)' },
          '90%': { opacity: '0.95', transform: 'scale(1)' },
        },
        particleFade: {
          '0%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) translateY(-20px) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) translateY(-40px) scale(0)',
          },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { transform: 'scale(0.9)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
// Rosa Maria's colours: Marian blue, soft rose and a warm cream page.
export default {
  content: ['./index.html', './*.tsx', './components/**/*.tsx', './services/**/*.ts'],
  theme: {
    extend: {
      colors: {
        cream: '#fbf7f1',
        ink: '#23263a',
        marian: {
          50: '#f1f5fc',
          100: '#dfe8f8',
          200: '#bccfee',
          300: '#8fade0',
          400: '#5f86cc',
          500: '#3f67b4',
          600: '#2f5299',
          700: '#26437e',
          800: '#203866',
          900: '#1a2d50',
        },
        rosa: {
          50: '#fdf3f5',
          100: '#fbe5ea',
          200: '#f6c9d3',
          300: '#eda2b3',
          400: '#e07b93',
          500: '#cf5a77',
          600: '#b3445f',
          700: '#93364d',
          800: '#782f42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'ui-serif', 'serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.96) rotate(-1deg)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'card-in': 'card-in 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        float: 'float 5s ease-in-out 1.1s infinite',
        'fade-in-late': 'fade-in 0.8s ease-out 0.9s both',
      },
    },
  },
  plugins: [],
};

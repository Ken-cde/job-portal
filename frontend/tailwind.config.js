/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        p3midnight: "#06111f",
        p3navy: "#081827",
        p3cyan: "#78e8ff",
        p3aqua: "#b2fefe",
      },
      backgroundImage: {
        'p3-gradient': 'radial-gradient(circle at center, #0c2444 0%, #06111f 100%)',
        'p3-glow': 'radial-gradient(circle at 50% 50%, rgba(120, 232, 255, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'drift': 'drift 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', filter: 'blur(40px)' },
          '50%': { opacity: '0.8', filter: 'blur(60px)' },
        },
        drift: {
          '0%': { transform: 'translateX(-10%) translateY(-10%)' },
          '100%': { transform: 'translateX(10%) translateY(10%)' },
        }
      }
    },
  },
  plugins: [],
}

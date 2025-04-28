/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00e0ff',
        'dark-blue': '#001a2c',
        'cyber-black': '#0a0a0a',
        'neural-gray': '#2a2a3a',
      },
      boxShadow: {
        'neon': '0 0 20px #00e0ff44',
        'neon-strong': '0 0 30px #00e0ff88',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00e0ff22' },
          '100%': { boxShadow: '0 0 20px #00e0ff88' },
        }
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070C',
        fg: '#F2F4F8',
        accent: '#7C9CF0',
        muted: '#8B92A3',
        border: 'rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading)', 'Quicksand', 'Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee var(--duration, 40s) linear infinite',
      },
    },
  },
  plugins: [],
};

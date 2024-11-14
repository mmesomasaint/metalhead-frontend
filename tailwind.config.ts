import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.5s ease-out', // Custom animation class
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' }, // Start offscreen to the right
          '100%': { transform: 'translateX(0)', opacity: '1' }, // End in place
        },
      },
    },
  },
  plugins: [],
}
export default config

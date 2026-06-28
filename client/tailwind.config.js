/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#F7F5F2',       // warm off-white background
        surface: '#FFFFFF',    // card surface
        accent: {
          DEFAULT: '#4CAF78',  // muted green — health/nature
          dark: '#2E7D54',     // readable green text on light tints
          light: '#E8F5EE',    // soft green tint (safe banners)
        },
        coral: {
          DEFAULT: '#E8734A',  // warm coral — warnings / low scores
          light: '#FCEDE7',    // soft coral tint (warning banners)
        },
        warn: '#F59E0B',       // amber — middling scores
        ink: '#1A1A2E',        // text primary
        subtle: '#6B7280',     // text secondary
        line: '#EEEBE6',       // border / divider
        mint: '#F0FDF4',       // macro pill background
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,26,46,0.04), 0 10px 30px rgba(26,26,46,0.06)',
        soft: '0 2px 14px rgba(26,26,46,0.06)',
        focus: '0 0 0 4px rgba(76,175,120,0.20)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(76,175,120,0.55)' },
          '50%': { boxShadow: '0 0 0 7px rgba(76,175,120,0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'fade-in-down': 'fade-in-down 0.2s ease-out',
        'scan-pulse': 'scan-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

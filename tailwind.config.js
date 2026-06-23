/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === MISSY & PO DESIGN SYSTEM ===
        coral: {
          DEFAULT: '#E56A6A',
          dark: '#C85A5A',
          light: '#F08080',
        },
        salmon: {
          DEFAULT: '#F4A0A0',
          light: '#F9C0C0',
        },
        brand: {
          gold: '#F5A623',
          yellow: '#FBBF24',
          green: {
            sale: '#22C55E',
            price: '#16A34A',
          },
          whatsapp: '#25D366',
        },
      },
      fontFamily: {
        brand: ['Dancing Script', 'cursive'],
        hero:  ['Pacifico', 'cursive'],
        body:  ['Inter', 'sans-serif'],
        ui:    ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'catalog-gradient': 'linear-gradient(to bottom, #F4A0A0, #F5A623)',
        'hero-gradient': 'linear-gradient(135deg, #E56A6A 0%, #F5A623 100%)',
        'coral-gradient': 'linear-gradient(135deg, #E56A6A 0%, #C85A5A 100%)',
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
        'bounce-in': 'bounce-in 0.6s ease-out both',
        crossfade: 'crossfade 1s ease-in-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'float-up': 'float-up 0.4s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0) translateY(-20px)', opacity: '0' },
          '60%': { transform: 'scale(1.1) translateY(5px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        crossfade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'coral': '0 4px 24px rgba(229, 106, 106, 0.35)',
        'card': '0 2px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.14)',
        'drawer': '4px 0 24px rgba(0,0,0,0.18)',
        'popup': '0 8px 32px rgba(0,0,0,0.18)',
      },
      zIndex: {
        'navbar': '50',
        'drawer': '60',
        'popup': '70',
        'float': '80',
        'overlay': '55',
      }
    },
  },
  plugins: [],
}

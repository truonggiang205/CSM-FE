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
          DEFAULT: '#4E9F76', // Fresh Sage / Mint Pastel
          dark: '#387B5B',
          light: '#6FB994',
          tint: '#EAF5EF',
        },
        accent: {
          DEFAULT: '#F59E6C', // Pastel Peach / Warm Apricot
          dark: '#D97B48',
          light: '#F9BFA0',
          tint: '#FFF2EB',
        },
        pastel: {
          mint: '#EAF5EF',
          peach: '#FFF2EB',
          lavender: '#EFEFFB',
          sky: '#E8F4FA',
          butter: '#FEF8E7',
          rose: '#FEEFEF',
        },
        background: 'var(--bg-background)',
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F8F6',
        },
        foreground: 'var(--text-foreground)',
        muted: {
          DEFAULT: 'var(--text-muted)',
          dark: '#4A5B53',
        },
        success: {
          DEFAULT: '#48BB78',
          dark: '#276749',
          pastel: '#EDFAF1',
        },
        warning: {
          DEFAULT: '#E59B3C',
          dark: '#975A16',
          pastel: '#FEF9E7',
        },
        danger: {
          DEFAULT: '#F56565',
          dark: '#9B2C2C',
          pastel: '#FEF2F2',
        },
        info: {
          DEFAULT: '#4299E1',
          dark: '#2B6CB0',
          pastel: '#EBF8FF',
        },
        border: 'var(--border-color)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'h1': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.3', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(78, 159, 118, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 28px -4px rgba(78, 159, 118, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

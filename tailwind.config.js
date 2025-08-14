/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
          light: '#DBEAFE'
        },
        secondary: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          pale: '#ECFDF5'
        },
        accent: {
          primary: '#7C3AED',
          secondary: '#F59E0B'
        },
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        info: '#0EA5E9',
        neutral: {
          900: '#0B1220',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#F9FAFB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.2px' }],
        'h2': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'h4': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px' }],
        'body': ['14px', { lineHeight: '22px' }],
        'caption': ['12px', { lineHeight: '18px' }],
        'label': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.5px' }]
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '70': '17.5rem',
        '72': '18rem',
        '76': '19rem',
        '84': '21rem',
        '88': '22rem'
      },
      borderRadius: {
        'card': '16px',
        'button': '12px'
      },
      boxShadow: {
        'soft-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08)'
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'spin-slow': 'spin 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}
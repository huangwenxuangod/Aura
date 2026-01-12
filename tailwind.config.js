/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 2026 Aurora Design System
        // Primary - Aurora Violet
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Secondary - Aurora Cyan
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Accent - Aurora Pink
        pink: {
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        // Dark Mode Background System
        dark: {
          base: '#030712',
          elevated: '#0f172a',
          surface: '#1e293b',
        },
        // Glass Surface Colors
        glass: {
          50: 'rgba(255, 255, 255, 0.02)',
          100: 'rgba(255, 255, 255, 0.04)',
          200: 'rgba(255, 255, 255, 0.06)',
          300: 'rgba(255, 255, 255, 0.08)',
          400: 'rgba(255, 255, 255, 0.12)',
          500: 'rgba(255, 255, 255, 0.16)',
        },
        // Border Colors
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.10)',
          strong: 'rgba(255, 255, 255, 0.16)',
        },
        // Text Colors
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          muted: '#475569',
        },
        // Semantic Colors
        success: {
          light: '#34d399',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        warning: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        error: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        info: {
          light: '#60a5fa',
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '28px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      fontSize: {
        'display-xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        'display': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        'heading-1': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
        'heading-2': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        'heading-3': ['20px', { lineHeight: '28px' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '16px' }],
        'overline': ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow-primary': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.2)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.2)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.2)',
        'inset-glass': 'inset 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
        'button-primary': '0 4px 20px rgba(168, 85, 247, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(168, 85, 247, 0.1)',
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse at 20% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
        'gradient-primary': 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #9333ea 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(236, 72, 153, 0.08) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

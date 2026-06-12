/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Chivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // PoH forensic palette (may need to update later)
        ink: '#08090A',
        surface: '#121417',
        surfacehover: '#1A1D21',
        hairline: 'rgba(255,255,255,0.08)',
        // Status semantics (hex so opacity modifiers work-Check this first)
        trusted: '#34D399',
        suspicious: '#FBBF24',
        fraudulent: '#F87171',
        review: '#60A5FA',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-dot': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        'marquee': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        'shimmer': { '0%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } },
        'glow-pulse': { '0%,100%': { opacity: '0.35', transform: 'scale(1)' }, '50%': { opacity: '0.7', transform: 'scale(1.06)' } },
        'scanline': { '0%': { transform: 'translateY(-10%)' }, '100%': { transform: 'translateY(1400%)' } },
        'gradient-x': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'rotate360': { to: { transform: 'rotate(360deg)' } },
        'blink': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'marquee': 'marquee 38s linear infinite',
        'float': 'float 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'scanline': 'scanline 6s linear infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'spin-slow': 'rotate360 7s linear infinite',
        'blink': 'blink 1.1s step-end infinite',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

import type {Config} from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'oklch(var(--color-background))',
        foreground: 'oklch(var(--color-foreground))',
        card: {
          DEFAULT: 'oklch(var(--color-card))',
          foreground: 'oklch(var(--color-card-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--color-popover))',
          foreground: 'oklch(var(--color-popover-foreground))',
        },
        primary: {
          DEFAULT: 'oklch(var(--color-primary))',
          foreground: 'oklch(var(--color-primary-foreground))',
        },
        'primary-light-bg': 'oklch(var(--color-primary-light-bg))',
        secondary: {
          DEFAULT: 'oklch(var(--color-secondary))',
          foreground: 'oklch(var(--color-secondary-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--color-muted))',
          foreground: 'oklch(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--color-accent))',
          foreground: 'oklch(var(--color-accent-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--color-destructive))',
          foreground: 'oklch(var(--color-destructive-foreground))',
        },
        border: 'oklch(var(--color-border))',
        input: 'oklch(var(--color-input))',
        ring: 'oklch(var(--color-ring))',
        chart: {
          '1': 'oklch(var(--color-chart-1))',
          '2': 'oklch(var(--color-chart-2))',
          '3': 'oklch(var(--color-chart-3))',
          '4': 'oklch(var(--color-chart-4))',
          '5': 'oklch(var(--color-chart-5))',
        },
        sidebar: {
          DEFAULT: 'oklch(var(--color-sidebar-background))',
          foreground: 'oklch(var(--color-sidebar-foreground))',
          primary: 'oklch(var(--color-sidebar-primary))',
          'primary-foreground': 'oklch(var(--color-sidebar-primary-foreground))',
          accent: 'oklch(var(--color-sidebar-accent))',
          'accent-foreground': 'oklch(var(--color-sidebar-accent-foreground))',
          border: 'oklch(var(--color-sidebar-border))',
          ring: 'oklch(var(--color-sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

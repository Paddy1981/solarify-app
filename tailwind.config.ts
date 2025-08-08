import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem", 
        md: "2rem",
        lg: "2rem",
        xl: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        headline: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        code: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        border: 'hsl(var(--border))',
        input: {
          DEFAULT: 'hsl(var(--input))',
          border: 'hsl(var(--input-border))',
        },
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Solar-specific color system
        'solar-primary': 'hsl(var(--solar-primary))',
        'solar-secondary': 'hsl(var(--solar-secondary))',
        'solar-accent': 'hsl(var(--solar-accent))',
        'energy-primary': 'hsl(var(--energy-primary))',
        'energy-secondary': 'hsl(var(--energy-secondary))',
        'eco-primary': 'hsl(var(--eco-primary))',
        'eco-secondary': 'hsl(var(--eco-secondary))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        'mobile-safe': '1rem',
        'mobile-comfortable': '1.5rem',
        'touch-target': '2.75rem', // 44px minimum touch target
      },
      fontSize: {
        // Mobile-first responsive sizes
        'mobile-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.0125em' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.0125em' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'mobile-2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        
        // Display sizes with fluid scaling
        'display-sm': ['clamp(1.875rem, 3vw, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2.25rem, 4vw, 3.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(3rem, 5vw, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.025em' }],
        
        // Solar-specific text sizes
        'solar-metric': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.0125em' }],
        'energy-value': ['2rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'savings-amount': ['1.25rem', { lineHeight: '1.2', letterSpacing: '-0.0125em' }],
      },
      minHeight: {
        'touch-target': '2.75rem', // 44px
        'mobile-header': '3.5rem', // 56px
      },
      maxWidth: {
        'mobile-content': '100vw',
        'mobile-readable': '65ch',
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
        'slide-up': {
          from: {
            transform: 'translateY(100%)',
          },
          to: {
            transform: 'translateY(0)',
          },
        },
        'slide-down': {
          from: {
            transform: 'translateY(-100%)',
          },
          to: {
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

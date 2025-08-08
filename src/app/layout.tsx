import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from '@/context/cart-context';
import { QueryClientProviderWrapper } from '@/providers/query-client-provider';
import { ErrorTrackingProvider } from '@/components/monitoring/ErrorTrackingProvider';
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor';
import { GlobalErrorBoundary } from '@/components/error-boundaries/GlobalErrorBoundary';
import { AccessibilityProvider } from '@/components/accessibility';
import { MobileOptimizationProvider } from '@/components/providers/mobile-optimization-provider';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Solarify - Your Residential Solar Ecosystem',
  description: 'Calculate energy needs, get RFQs, monitor solar systems, and more with Solarify.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <GlobalErrorBoundary>
          <ThemeProvider>
            <MobileOptimizationProvider>
              <AccessibilityProvider>
                <ErrorTrackingProvider>
                  <QueryClientProviderWrapper>
                    <CartProvider> 
                      <PerformanceMonitor>
                        <Header />
                        <main className="flex-grow container mx-auto px-mobile-safe sm:px-4 py-mobile-safe sm:py-8">
                          {children}
                        </main>
                        <Footer />
                        <Toaster />
                      </PerformanceMonitor>
                    </CartProvider>
                  </QueryClientProviderWrapper>
                </ErrorTrackingProvider>
              </AccessibilityProvider>
            </MobileOptimizationProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}

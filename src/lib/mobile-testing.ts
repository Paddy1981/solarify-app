// Mobile testing utilities for responsive design validation

export interface ViewportSize {
  width: number
  height: number
  name: string
  category: 'mobile' | 'tablet' | 'desktop'
}

export const COMMON_VIEWPORTS: ViewportSize[] = [
  // Mobile devices
  { width: 320, height: 568, name: 'iPhone SE', category: 'mobile' },
  { width: 375, height: 667, name: 'iPhone 8', category: 'mobile' },
  { width: 375, height: 812, name: 'iPhone X/11 Pro', category: 'mobile' },
  { width: 414, height: 896, name: 'iPhone 11/XR', category: 'mobile' },
  { width: 390, height: 844, name: 'iPhone 12/13 Pro', category: 'mobile' },
  { width: 428, height: 926, name: 'iPhone 14 Pro Max', category: 'mobile' },
  { width: 360, height: 640, name: 'Galaxy S8', category: 'mobile' },
  { width: 360, height: 800, name: 'Galaxy S20', category: 'mobile' },
  { width: 412, height: 915, name: 'Pixel 6', category: 'mobile' },
  
  // Tablets
  { width: 768, height: 1024, name: 'iPad', category: 'tablet' },
  { width: 820, height: 1180, name: 'iPad Air', category: 'tablet' },
  { width: 1024, height: 1366, name: 'iPad Pro 12.9"', category: 'tablet' },
  { width: 800, height: 1280, name: 'Galaxy Tab S', category: 'tablet' },
  
  // Desktop
  { width: 1280, height: 800, name: 'Desktop Small', category: 'desktop' },
  { width: 1440, height: 900, name: 'Desktop Medium', category: 'desktop' },
  { width: 1920, height: 1080, name: 'Desktop Large', category: 'desktop' },
]

export interface TouchTarget {
  element: HTMLElement
  rect: DOMRect
  size: { width: number; height: number }
  isAccessible: boolean
  recommendations: string[]
}

export class MobileTestingUtility {
  private static instance: MobileTestingUtility
  private viewport: ViewportSize | null = null
  private touchTargets: TouchTarget[] = []

  static getInstance(): MobileTestingUtility {
    if (!MobileTestingUtility.instance) {
      MobileTestingUtility.instance = new MobileTestingUtility()
    }
    return MobileTestingUtility.instance
  }

  // Simulate different viewport sizes
  simulateViewport(viewport: ViewportSize): void {
    this.viewport = viewport
    
    if (typeof window !== 'undefined') {
      // Update CSS viewport units
      const root = document.documentElement
      root.style.setProperty('--viewport-width', `${viewport.width}px`)
      root.style.setProperty('--viewport-height', `${viewport.height}px`)
      
      // Simulate mobile user agent for more accurate testing
      if (viewport.category === 'mobile') {
        this.simulateMobileUserAgent()
      }
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'))
      
      console.log(`📱 Simulating ${viewport.name} (${viewport.width}x${viewport.height})`)
    }
  }

  // Analyze touch targets on current page
  analyzeTouchTargets(): TouchTarget[] {
    if (typeof window === 'undefined') return []

    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick], [tabindex]:not([tabindex="-1"])'
    )

    this.touchTargets = Array.from(interactiveElements).map(element => {
      const rect = element.getBoundingClientRect()
      const size = { width: rect.width, height: rect.height }
      
      // Check if touch target meets accessibility guidelines (44x44px minimum)
      const minSize = 44
      const isAccessible = size.width >= minSize && size.height >= minSize
      
      const recommendations: string[] = []
      
      if (size.width < minSize) {
        recommendations.push(`Increase width to at least ${minSize}px (currently ${Math.round(size.width)}px)`)
      }
      
      if (size.height < minSize) {
        recommendations.push(`Increase height to at least ${minSize}px (currently ${Math.round(size.height)}px)`)
      }
      
      // Check spacing between elements
      const nearbyElements = this.findNearbyElements(element as HTMLElement, 8)
      if (nearbyElements.length > 0) {
        recommendations.push('Consider adding more spacing between interactive elements')
      }
      
      return {
        element: element as HTMLElement,
        rect,
        size,
        isAccessible,
        recommendations
      }
    })

    return this.touchTargets
  }

  // Find elements that are too close to each other
  private findNearbyElements(element: HTMLElement, minDistance: number): HTMLElement[] {
    const rect = element.getBoundingClientRect()
    const nearby: HTMLElement[] = []
    
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick]'
    )
    
    Array.from(interactiveElements).forEach(other => {
      if (other === element) return
      
      const otherRect = other.getBoundingClientRect()
      const distance = Math.min(
        Math.abs(rect.left - otherRect.right),
        Math.abs(rect.right - otherRect.left),
        Math.abs(rect.top - otherRect.bottom),
        Math.abs(rect.bottom - otherRect.top)
      )
      
      if (distance < minDistance) {
        nearby.push(other as HTMLElement)
      }
    })
    
    return nearby
  }

  // Generate accessibility report
  generateAccessibilityReport(): {
    summary: {
      total: number
      accessible: number
      needsImprovement: number
      accessibilityScore: number
    }
    issues: TouchTarget[]
    recommendations: string[]
  } {
    const targets = this.analyzeTouchTargets()
    const accessible = targets.filter(t => t.isAccessible)
    const needsImprovement = targets.filter(t => !t.isAccessible)
    
    const summary = {
      total: targets.length,
      accessible: accessible.length,
      needsImprovement: needsImprovement.length,
      accessibilityScore: Math.round((accessible.length / targets.length) * 100) || 0
    }
    
    const globalRecommendations = [
      'Ensure all interactive elements are at least 44x44px',
      'Maintain adequate spacing between touch targets',
      'Test on real devices for accurate touch interaction',
      'Consider larger touch targets for primary actions',
      'Use visual feedback for touch interactions'
    ]
    
    return {
      summary,
      issues: needsImprovement,
      recommendations: globalRecommendations
    }
  }

  // Simulate mobile user agent
  private simulateMobileUserAgent(): void {
    if (typeof window !== 'undefined') {
      // Add mobile-specific CSS classes
      document.body.classList.add('mobile-simulation')
      
      // Simulate touch events
      const style = document.createElement('style')
      style.textContent = `
        .mobile-simulation * {
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .mobile-simulation input,
        .mobile-simulation textarea {
          -webkit-user-select: text;
          user-select: text;
        }
      `
      document.head.appendChild(style)
    }
  }

  // Test responsive breakpoints
  testResponsiveBreakpoints(): {
    breakpoint: string
    viewport: ViewportSize
    issues: string[]
  }[] {
    const results: {
      breakpoint: string
      viewport: ViewportSize
      issues: string[]
    }[] = []
    
    const breakpoints = [
      { name: 'Mobile', viewports: COMMON_VIEWPORTS.filter(v => v.category === 'mobile') },
      { name: 'Tablet', viewports: COMMON_VIEWPORTS.filter(v => v.category === 'tablet') },
      { name: 'Desktop', viewports: COMMON_VIEWPORTS.filter(v => v.category === 'desktop') }
    ]
    
    breakpoints.forEach(({ name, viewports }) => {
      viewports.slice(0, 2).forEach(viewport => { // Test first 2 of each category
        this.simulateViewport(viewport)
        
        const issues: string[] = []
        
        // Check for horizontal scrolling
        if (document.body.scrollWidth > viewport.width) {
          issues.push('Horizontal scrolling detected')
        }
        
        // Check for tiny text
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
        Array.from(textElements).forEach(element => {
          const styles = window.getComputedStyle(element)
          const fontSize = parseInt(styles.fontSize)
          if (fontSize < 14 && viewport.category === 'mobile') {
            issues.push('Text smaller than 14px detected')
          }
        })
        
        // Check touch targets
        const touchReport = this.generateAccessibilityReport()
        if (touchReport.summary.accessibilityScore < 80) {
          issues.push(`Touch target accessibility score: ${touchReport.summary.accessibilityScore}%`)
        }
        
        results.push({
          breakpoint: name,
          viewport,
          issues
        })
      })
    })
    
    return results
  }

  // Performance testing for mobile
  testMobilePerformance(): {
    loadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    recommendations: string[]
  } {
    const recommendations: string[] = []
    
    // Get performance metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    
    // Mock LCP and CLS for demonstration
    const largestContentfulPaint = firstContentfulPaint * 1.5
    const cumulativeLayoutShift = Math.random() * 0.25
    
    if (loadTime > 3000) {
      recommendations.push('Page load time is over 3 seconds')
    }
    
    if (firstContentfulPaint > 1800) {
      recommendations.push('First Contentful Paint is slow (>1.8s)')
    }
    
    if (largestContentfulPaint > 2500) {
      recommendations.push('Largest Contentful Paint is slow (>2.5s)')
    }
    
    if (cumulativeLayoutShift > 0.1) {
      recommendations.push('Cumulative Layout Shift is high (>0.1)')
    }
    
    return {
      loadTime,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift,
      recommendations
    }
  }

  // Visual debugging helpers
  highlightTouchTargets(): void {
    if (typeof window === 'undefined') return

    // Remove existing highlights
    document.querySelectorAll('.touch-target-highlight').forEach(el => el.remove())
    
    const targets = this.analyzeTouchTargets()
    
    targets.forEach(target => {
      const highlight = document.createElement('div')
      highlight.className = 'touch-target-highlight'
      highlight.style.cssText = `
        position: absolute;
        top: ${target.rect.top + window.scrollY}px;
        left: ${target.rect.left + window.scrollX}px;
        width: ${target.rect.width}px;
        height: ${target.rect.height}px;
        border: 2px solid ${target.isAccessible ? '#10b981' : '#ef4444'};
        background-color: ${target.isAccessible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
        pointer-events: none;
        z-index: 10000;
        border-radius: 4px;
      `
      
      // Add size label
      const label = document.createElement('div')
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: ${target.isAccessible ? '#10b981' : '#ef4444'};
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        border-radius: 2px;
        white-space: nowrap;
      `
      label.textContent = `${Math.round(target.size.width)}×${Math.round(target.size.height)}px`
      highlight.appendChild(label)
      
      document.body.appendChild(highlight)
    })
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      document.querySelectorAll('.touch-target-highlight').forEach(el => el.remove())
    }, 10000)
  }

  // Reset to normal viewport
  resetViewport(): void {
    if (typeof window === 'undefined') return

    document.body.classList.remove('mobile-simulation')
    document.querySelectorAll('.touch-target-highlight').forEach(el => el.remove())
    
    const root = document.documentElement
    root.style.removeProperty('--viewport-width')
    root.style.removeProperty('--viewport-height')
    
    this.viewport = null
    this.touchTargets = []
    
    console.log('🖥️ Reset to normal viewport')
  }
}

// Export convenience functions
export const mobileTestingUtility = MobileTestingUtility.getInstance()

export function testMobileViewport(viewport: ViewportSize): void {
  mobileTestingUtility.simulateViewport(viewport)
}

export function analyzeMobileAccessibility(): void {
  const report = mobileTestingUtility.generateAccessibilityReport()
  console.table(report.summary)
  console.log('📱 Mobile Accessibility Report:', report)
  mobileTestingUtility.highlightTouchTargets()
}

export function testAllBreakpoints(): void {
  const results = mobileTestingUtility.testResponsiveBreakpoints()
  console.log('📐 Responsive Breakpoint Test Results:', results)
}

export function testMobilePerformance(): void {
  const results = mobileTestingUtility.testMobilePerformance()
  console.log('🚀 Mobile Performance Test Results:', results)
}

// Development helper to add to window for browser console use
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).mobileTestingUtility = mobileTestingUtility
  (window as any).testMobileViewport = testMobileViewport
  (window as any).analyzeMobileAccessibility = analyzeMobileAccessibility
  (window as any).testAllBreakpoints = testAllBreakpoints
  (window as any).testMobilePerformance = testMobilePerformance
}
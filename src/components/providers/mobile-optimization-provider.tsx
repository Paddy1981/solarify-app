"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useIsMobile, useIsTouchDevice, useViewport } from '@/hooks/use-mobile'

interface MobileOptimizationContextType {
  isMobile: boolean
  isTouch: boolean
  viewport: { width: number | undefined; height: number | undefined }
  orientation: 'portrait' | 'landscape' | undefined
  connection: {
    effectiveType: string
    downlink: number
    rtt: number
  } | undefined
  deviceMemory: number | undefined
  reducedMotion: boolean
  darkMode: boolean
  highContrast: boolean
}

const MobileOptimizationContext = createContext<MobileOptimizationContextType | undefined>(undefined)

export function useMobileOptimization() {
  const context = useContext(MobileOptimizationContext)
  if (!context) {
    throw new Error('useMobileOptimization must be used within a MobileOptimizationProvider')
  }
  return context
}

interface MobileOptimizationProviderProps {
  children: React.ReactNode
}

export function MobileOptimizationProvider({ children }: MobileOptimizationProviderProps) {
  const isMobile = useIsMobile()
  const isTouch = useIsTouchDevice()
  const viewport = useViewport()
  
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | undefined>(undefined)
  const [connection, setConnection] = useState<{
    effectiveType: string
    downlink: number
    rtt: number
  } | undefined>(undefined)
  const [deviceMemory, setDeviceMemory] = useState<number | undefined>(undefined)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  // Detect orientation changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation('landscape')
      } else {
        setOrientation('portrait')
      }
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  // Detect network connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateConnection = () => {
      const nav = navigator as any
      if (nav.connection || nav.mozConnection || nav.webkitConnection) {
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection
        setConnection({
          effectiveType: conn.effectiveType || '4g',
          downlink: conn.downlink || 10,
          rtt: conn.rtt || 100
        })
      }
    }

    updateConnection()
    
    const nav = navigator as any
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection
    if (conn) {
      conn.addEventListener('change', updateConnection)
      return () => conn.removeEventListener('change', updateConnection)
    }
  }, [])

  // Detect device memory
  useEffect(() => {
    if (typeof window === 'undefined') return

    const nav = navigator as any
    if (nav.deviceMemory) {
      setDeviceMemory(nav.deviceMemory)
    }
  }, [])

  // Detect user preferences
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')

    const updateReducedMotion = () => setReducedMotion(reducedMotionQuery.matches)
    const updateDarkMode = () => setDarkMode(darkModeQuery.matches)
    const updateHighContrast = () => setHighContrast(highContrastQuery.matches)

    updateReducedMotion()
    updateDarkMode()
    updateHighContrast()

    reducedMotionQuery.addEventListener('change', updateReducedMotion)
    darkModeQuery.addEventListener('change', updateDarkMode)
    highContrastQuery.addEventListener('change', updateHighContrast)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateReducedMotion)
      darkModeQuery.removeEventListener('change', updateDarkMode)
      highContrastQuery.removeEventListener('change', updateHighContrast)
    }
  }, [])

  // Apply mobile optimizations
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Apply mobile class
    if (isMobile) {
      root.classList.add('mobile-device')
    } else {
      root.classList.remove('mobile-device')
    }

    // Apply touch device class
    if (isTouch) {
      root.classList.add('touch-device')
    } else {
      root.classList.remove('touch-device')
    }

    // Apply orientation class
    if (orientation) {
      root.classList.add(`orientation-${orientation}`)
      root.classList.remove(`orientation-${orientation === 'portrait' ? 'landscape' : 'portrait'}`)
    }

    // Apply connection class
    if (connection) {
      root.classList.add(`connection-${connection.effectiveType}`)
      
      // Optimize for slow connections
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        root.classList.add('slow-connection')
      } else {
        root.classList.remove('slow-connection')
      }
    }

    // Apply memory class
    if (deviceMemory) {
      root.classList.add(`memory-${deviceMemory}gb`)
      
      // Optimize for low memory devices
      if (deviceMemory <= 2) {
        root.classList.add('low-memory')
      } else {
        root.classList.remove('low-memory')
      }
    }

    // Apply accessibility classes
    if (reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    return () => {
      // Cleanup classes on unmount
      root.classList.remove(
        'mobile-device',
        'touch-device',
        'orientation-portrait',
        'orientation-landscape',
        'slow-connection',
        'low-memory',
        'reduce-motion',
        'high-contrast'
      )
    }
  }, [isMobile, isTouch, orientation, connection, deviceMemory, reducedMotion, highContrast])

  // Apply viewport meta tag optimizations
  useEffect(() => {
    if (typeof document === 'undefined') return

    let viewportMeta = document.querySelector('meta[name="viewport"]')
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.setAttribute('name', 'viewport')
      document.head.appendChild(viewportMeta)
    }

    // Set optimal viewport settings for mobile
    const viewportContent = isMobile 
      ? 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
      : 'width=device-width, initial-scale=1.0'

    viewportMeta.setAttribute('content', viewportContent)

    // Add theme-color meta tag for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeColorMeta && isMobile) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.setAttribute('name', 'theme-color')
      themeColorMeta.setAttribute('content', darkMode ? '#0a0a0a' : '#f5f5f5')
      document.head.appendChild(themeColorMeta)
    } else if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? '#0a0a0a' : '#f5f5f5')
    }

    // Add apple-mobile-web-app-capable for iOS
    if (isMobile) {
      let appleMobileMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
      if (!appleMobileMeta) {
        appleMobileMeta = document.createElement('meta')
        appleMobileMeta.setAttribute('name', 'apple-mobile-web-app-capable')
        appleMobileMeta.setAttribute('content', 'yes')
        document.head.appendChild(appleMobileMeta)
      }

      let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      if (!appleStatusBarMeta) {
        appleStatusBarMeta = document.createElement('meta')
        appleStatusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
        appleStatusBarMeta.setAttribute('content', 'default')
        document.head.appendChild(appleStatusBarMeta)
      }
    }
  }, [isMobile, darkMode])

  // Performance optimizations based on device capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Disable animations on low-end devices
    if (reducedMotion || (deviceMemory && deviceMemory <= 2) || (connection && connection.effectiveType === '2g')) {
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [reducedMotion, deviceMemory, connection])

  const contextValue: MobileOptimizationContextType = {
    isMobile,
    isTouch,
    viewport,
    orientation,
    connection,
    deviceMemory,
    reducedMotion,
    darkMode,
    highContrast
  }

  return (
    <MobileOptimizationContext.Provider value={contextValue}>
      {children}
    </MobileOptimizationContext.Provider>
  )
}
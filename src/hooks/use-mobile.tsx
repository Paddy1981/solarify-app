import * as React from "react"

const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useBreakpoint(breakpoint: Breakpoint) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    const onChange = () => {
      setMatches(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!matches
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return !!matches
}

// Responsive utilities
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const [currentValue, setCurrentValue] = React.useState<T>(defaultValue)

  React.useEffect(() => {
    const updateValue = () => {
      const width = window.innerWidth
      
      // Check breakpoints in descending order
      const breakpointEntries = Object.entries(values).sort(
        ([a], [b]) => BREAKPOINTS[b as Breakpoint] - BREAKPOINTS[a as Breakpoint]
      )
      
      for (const [breakpoint, value] of breakpointEntries) {
        if (width >= BREAKPOINTS[breakpoint as Breakpoint]) {
          setCurrentValue(value as T)
          return
        }
      }
      
      setCurrentValue(defaultValue)
    }

    updateValue()
    window.addEventListener("resize", updateValue)
    return () => window.removeEventListener("resize", updateValue)
  }, [values, defaultValue])

  return currentValue
}

// Touch device detection
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      )
    }
    
    checkTouch()
  }, [])

  return !!isTouch
}

// Viewport dimensions
export function useViewport() {
  const [viewport, setViewport] = React.useState<{
    width: number | undefined
    height: number | undefined
  }>({
    width: undefined,
    height: undefined
  })

  React.useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  return viewport
}

// Safe area insets for mobile devices
export function useSafeAreaInsets() {
  const [insets, setInsets] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  React.useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement)
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0'),
        right: parseInt(style.getPropertyValue('--sar') || '0'),
        bottom: parseInt(style.getPropertyValue('--sab') || '0'),
        left: parseInt(style.getPropertyValue('--sal') || '0')
      })
    }

    updateInsets()
    window.addEventListener("resize", updateInsets)
    return () => window.removeEventListener("resize", updateInsets)
  }, [])

  return insets
}

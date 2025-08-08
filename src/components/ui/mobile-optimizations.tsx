import * as React from "react"
import { useIsMobile, useIsTouchDevice } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Lazy loading component for mobile images
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  className?: string
  loading?: "lazy" | "eager"
}

export function LazyImage({
  src,
  alt,
  fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E",
  className,
  loading = "lazy",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        ref={imgRef}
        src={hasError ? fallback : src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}

// Mobile-optimized viewport component
interface MobileViewportProps {
  children: React.ReactNode
  className?: string
  safeArea?: boolean
}

export function MobileViewport({ 
  children, 
  className, 
  safeArea = true 
}: MobileViewportProps) {
  const isMobile = useIsMobile()
  
  return (
    <div 
      className={cn(
        "min-h-screen w-full",
        isMobile && safeArea && "pb-safe-bottom pl-safe-left pr-safe-right pt-safe-top",
        className
      )}
    >
      {children}
    </div>
  )
}

// Touch-optimized scroll area
interface MobileScrrollAreaProps {
  children: React.ReactNode
  className?: string
  direction?: "vertical" | "horizontal" | "both"
}

export function MobileScrollArea({ 
  children, 
  className,
  direction = "vertical" 
}: MobileScrrollAreaProps) {
  const isTouch = useIsTouchDevice()
  
  return (
    <div
      className={cn(
        "relative",
        direction === "vertical" && "overflow-y-auto overflow-x-hidden",
        direction === "horizontal" && "overflow-x-auto overflow-y-hidden",
        direction === "both" && "overflow-auto",
        isTouch && "[-webkit-overflow-scrolling:touch]",
        className
      )}
      style={{
        // Enable momentum scrolling on iOS
        WebkitOverflowScrolling: 'touch',
        // Hide scrollbars on mobile
        scrollbarWidth: isTouch ? 'none' : 'thin',
        msOverflowStyle: isTouch ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [startY, setStartY] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !isMobile) return
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isMobile || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY
    
    // Only track pull if at top of container and pulling down
    if (containerRef.current?.scrollTop === 0 && distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 100))
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || !isMobile || isRefreshing) return
    
    if (pullDistance > 60) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    setStartY(0)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {isMobile && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 bg-background/80 backdrop-blur"
          style={{
            transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
            height: '60px'
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Refreshing...</span>
            </div>
          ) : pullDistance > 60 ? (
            <div className="text-sm text-primary font-medium">Release to refresh</div>
          ) : pullDistance > 0 ? (
            <div className="text-sm text-muted-foreground">Pull to refresh</div>
          ) : null}
        </div>
      )}
      
      <div
        style={{
          transform: isMobile ? `translateY(${Math.max(pullDistance * 0.3, 0)}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Mobile-optimized modal/dialog
interface MobileModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  fullScreen?: boolean
}

export function MobileModal({
  children,
  isOpen,
  onClose,
  title,
  className,
  fullScreen = false
}: MobileModalProps) {
  const isMobile = useIsMobile()
  
  React.useEffect(() => {
    if (isOpen && isMobile) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, isMobile])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-background shadow-xl",
          isMobile && !fullScreen && "max-h-[90vh] rounded-t-xl animate-slide-up",
          isMobile && fullScreen && "h-full",
          !isMobile && "max-w-lg mx-4 rounded-lg max-h-[90vh]",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="overflow-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile bottom sheet
interface MobileBottomSheetProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
  snapPoints?: number[]
}

export function MobileBottomSheet({
  children,
  isOpen,
  onClose,
  title,
  className,
  snapPoints = [0.5, 0.9]
}: MobileBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = React.useState(snapPoints[0])
  const [isDragging, setIsDragging] = React.useState(false)
  const [startY, setStartY] = React.useState(0)
  const isMobile = useIsMobile()

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentY = e.touches[0].clientY
    const deltaY = startY - currentY
    const newSnap = Math.min(Math.max(currentSnap + deltaY / window.innerHeight, 0), 1)
    setCurrentSnap(newSnap)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    // Snap to nearest snap point
    const nearest = snapPoints.reduce((prev, curr) => 
      Math.abs(curr - currentSnap) < Math.abs(prev - currentSnap) ? curr : prev
    )
    
    if (nearest < 0.2) {
      onClose()
    } else {
      setCurrentSnap(nearest)
    }
  }

  if (!isOpen || !isMobile) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-xl",
          className
        )}
        style={{
          height: `${currentSnap * 100}vh`,
          transition: isDragging ? 'none' : 'height 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center p-2">
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {title && (
          <div className="px-4 pb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        
        <div className="flex-1 overflow-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized list item with proper touch targets
interface MobileListItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function MobileListItem({
  children,
  onClick,
  className,
  disabled = false
}: MobileListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center min-h-[44px] px-4 py-3 transition-colors touch-manipulation",
        onClick && !disabled && "cursor-pointer hover:bg-accent/50 active:bg-accent",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  )
}

export { LazyImage, MobileViewport, MobileScrollArea, PullToRefresh, MobileModal, MobileBottomSheet, MobileListItem }
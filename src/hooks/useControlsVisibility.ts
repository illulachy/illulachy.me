import { useState, useEffect, useCallback, useRef } from 'react'

interface UseControlsVisibilityOptions {
  hideDelay?: number  // Desktop: 3000ms
  mobileHideDelay?: number  // Mobile: 5000ms
}

export function useControlsVisibility(options: UseControlsVisibilityOptions = {}) {
  const { hideDelay = 3000, mobileHideDelay = 5000 } = options
  const [visible, setVisible] = useState(true)
  const timeoutRef = useRef<number | undefined>(undefined)
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  
  const showControls = useCallback(() => {
    setVisible(true)
    window.clearTimeout(timeoutRef.current)
    
    const delay = isMobile ? mobileHideDelay : hideDelay
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false)
    }, delay)
  }, [hideDelay, mobileHideDelay, isMobile])
  
  useEffect(() => {
    // Show on initial load
    showControls()
    
    // Show on mouse move
    const handleMouseMove = () => showControls()
    const handleTouchStart = () => showControls()
    const handleWheel = () => showControls()
    const handleKeyDown = () => showControls()
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.clearTimeout(timeoutRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showControls])
  
  return { visible, showControls }
}

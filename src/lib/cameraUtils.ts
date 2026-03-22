import type { ViewportDimensions } from '@/types'
import { ZOOM_MIN, ZOOM_MAX, HUB_WIDTH, HUB_HEIGHT, HUB_VIEWPORT_FILL } from '@/types'

/**
 * Calculate initial zoom level so the portfolio hub fills ~40% of viewport
 * Hub dimensions: 640x360 (16:9 aspect ratio)
 * Target: Hub should occupy 40% of viewport width or height (whichever is limiting)
 */
export function calculateInitialZoom(viewport: ViewportDimensions): number {
  // Calculate zoom needed to make hub fill 40% of viewport
  const zoomByWidth = (viewport.width * HUB_VIEWPORT_FILL) / HUB_WIDTH
  const zoomByHeight = (viewport.height * HUB_VIEWPORT_FILL) / HUB_HEIGHT
  
  // Use the smaller zoom (limiting dimension) to ensure hub fits
  const calculatedZoom = Math.min(zoomByWidth, zoomByHeight)
  
  // Clamp to allowed zoom range
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, calculatedZoom))
}

/**
 * Get current viewport dimensions
 */
export function getViewportDimensions(): ViewportDimensions {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

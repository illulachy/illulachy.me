import { describe, it, expect } from 'vitest'
import { calculateInitialZoom } from './cameraUtils'

describe('calculateInitialZoom', () => {
  it('desktop 1920x1080 → reasonable zoom', () => {
    const zoom = calculateInitialZoom({ width: 1920, height: 1080 })
    // Expected: min(1920*0.4/640, 1080*0.4/360) = min(1.2, 1.2) = 1.2
    expect(zoom).toBeCloseTo(1.2, 1)
  })
  
  it('portrait mobile 375x812 → uses width-based zoom', () => {
    const zoom = calculateInitialZoom({ width: 375, height: 812 })
    // Expected: min(375*0.4/640, 812*0.4/360) = min(0.23, 0.90) = 0.23
    expect(zoom).toBeCloseTo(0.23, 1)
  })
  
  it('ultra-wide 3440x1440 → uses height-based zoom', () => {
    const zoom = calculateInitialZoom({ width: 3440, height: 1440 })
    // Expected: min(3440*0.4/640, 1440*0.4/360) = min(2.15, 1.6) = 1.6
    expect(zoom).toBeCloseTo(1.6, 1)
  })
  
  it('clamps to ZOOM_MIN for tiny viewport', () => {
    const zoom = calculateInitialZoom({ width: 100, height: 50 })
    expect(zoom).toBe(0.1)
  })
  
  it('clamps to ZOOM_MAX for huge viewport', () => {
    const zoom = calculateInitialZoom({ width: 10000, height: 10000 })
    expect(zoom).toBe(4.0)
  })
})

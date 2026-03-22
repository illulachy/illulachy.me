import type { CameraState } from '@/types'
import { CAMERA_SCHEMA_VERSION } from '@/types'

const STORAGE_KEY = 'illulachy-camera-state'

export function saveCameraState(state: Omit<CameraState, 'version'>): void {
  const data: CameraState = { ...state, version: CAMERA_SCHEMA_VERSION }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save camera state:', e)
  }
}

export function loadCameraState(): CameraState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data = JSON.parse(stored) as CameraState
    if (data.version !== CAMERA_SCHEMA_VERSION) {
      console.warn('Camera state schema mismatch, clearing')
      clearCameraState()
      return null
    }
    return data
  } catch (e) {
    console.warn('Failed to load camera state:', e)
    return null
  }
}

export function clearCameraState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

import { useState, useEffect } from 'react'
import type { AboutData } from '@/types/about'

interface UseAboutDataResult {
  data: AboutData | null
  isLoading: boolean
  error: Error | null
}

export function useAboutData(): UseAboutDataResult {
  const [data, setData] = useState<AboutData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/about.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch about: ${res.status}`)
        return res.json()
      })
      .then((json: AboutData) => {
        setData(json)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
      })
  }, [])

  return { data, isLoading, error }
}

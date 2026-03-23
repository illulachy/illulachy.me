import { useState, useEffect } from 'react'
import type { TimelineData } from '@/types/content'

interface UseTimelineDataResult {
  data: TimelineData | null
  isLoading: boolean
  error: Error | null
}

export function useTimelineData(): UseTimelineDataResult {
  const [data, setData] = useState<TimelineData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/timeline.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`)
        return res.json()
      })
      .then((json: TimelineData) => {
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

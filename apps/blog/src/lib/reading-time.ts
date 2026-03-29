/**
 * Calculates estimated reading time for a given text.
 * Assumes 200 words per minute reading speed.
 * Minimum reading time is 1 minute.
 */
export function calcReadingTime(text: string): string {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / wordsPerMinute))
  return `${minutes} min read`
}

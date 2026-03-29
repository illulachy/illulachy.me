/**
 * Calculates estimated reading time for a given text.
 * Assumes 200 words per minute reading speed.
 * Minimum reading time is 1 minute.
 */
export function calcReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

/**
 * Checks if a given blog post slug has a matching timeline entry.
 *
 * Matching logic: compare the last URL segment of each timeline entry's
 * `frontmatter.url` against the slug using exact equality (split('/').pop()).
 * This prevents false positives where "typescript" would wrongly match
 * "typescript-generics" (see RESEARCH Pitfall 6).
 */
export function hasTimelineEntry(
  slug: string,
  timelineModules: Record<string, any>
): boolean {
  return Object.values(timelineModules).some((mod) => {
    const url: string = mod?.frontmatter?.url ?? ''
    return url.split('/').pop() === slug
  })
}

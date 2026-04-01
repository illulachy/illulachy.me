import { describe, it, expect } from 'vitest'
import { hasTimelineEntry } from '../lib/timeline-match'

const mockModules: Record<string, any> = {
  '/content/2024/deep-dive-typescript.md': {
    frontmatter: { url: 'https://writing.illulachy.me/typescript-generics' },
  },
  '/content/2024/canvas-timeline-idea.md': {
    frontmatter: { url: 'https://youtube.com/watch?v=example3' },
  },
  '/content/2024/illulachy-launch.md': {
    frontmatter: { url: 'https://illulachy.me' },
  },
}

describe('hasTimelineEntry', () => {
  it('returns true when slug matches a timeline entry url last segment', () => {
    expect(hasTimelineEntry('typescript-generics', mockModules)).toBe(true)
  })

  it('returns false when no timeline entry url matches', () => {
    expect(hasTimelineEntry('nonexistent-post', mockModules)).toBe(false)
  })

  it('returns false for partial slug match (avoids false positives)', () => {
    expect(hasTimelineEntry('typescript', mockModules)).toBe(false)
  })

  it('returns false for empty modules object', () => {
    expect(hasTimelineEntry('any-slug', {})).toBe(false)
  })

  it('handles modules with missing frontmatter gracefully', () => {
    const modulesWithMissingFrontmatter: Record<string, any> = {
      '/content/2024/no-frontmatter.md': {},
      '/content/2024/empty-frontmatter.md': { frontmatter: {} },
    }
    expect(hasTimelineEntry('test', modulesWithMissingFrontmatter)).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

describe('glob resolution', () => {
  it('resolves >0 markdown files from packages/content/content/posts/', () => {
    // Validate the same path arithmetic used by import.meta.glob in src/pages/*.astro
    // From apps/blog/src/pages/ the glob uses ../../../../packages/content/content/posts/
    // From apps/blog/src/test/ (this file, same depth) the equivalent fs path is:
    const postsDir = resolve(__dirname, '..', '..', '..', '..', 'packages', 'content', 'content', 'posts')
    const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))
    expect(files.length).toBeGreaterThan(0)
    // Each file should be a valid markdown file
    files.forEach(f => {
      expect(f).toMatch(/\.md$/)
    })
  })

  it('posts directory contains expected test posts', () => {
    const postsDir = resolve(__dirname, '..', '..', '..', '..', 'packages', 'content', 'content', 'posts')
    const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))
    expect(files).toContain('deep-dive-typescript.md')
  })
})

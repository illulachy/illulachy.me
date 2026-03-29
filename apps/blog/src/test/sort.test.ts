import { describe, it, expect } from 'vitest'

interface PostStub {
  frontmatter: { date: string; title: string }
}

function sortPostsByDate(posts: PostStub[]): PostStub[] {
  return [...posts].sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  )
}

describe('sortPostsByDate', () => {
  it('sorts posts newest first', () => {
    const posts: PostStub[] = [
      { frontmatter: { date: '2024-01-15', title: 'B' } },
      { frontmatter: { date: '2023-11-03', title: 'C' } },
      { frontmatter: { date: '2024-04-10', title: 'A' } },
    ]
    const sorted = sortPostsByDate(posts)
    expect(sorted.map(p => p.frontmatter.title)).toEqual(['A', 'B', 'C'])
  })

  it('returns single post unchanged', () => {
    const posts: PostStub[] = [{ frontmatter: { date: '2024-01-01', title: 'Solo' } }]
    expect(sortPostsByDate(posts)).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(sortPostsByDate([])).toEqual([])
  })
})

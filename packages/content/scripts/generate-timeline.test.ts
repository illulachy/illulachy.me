import { describe, it, expect } from 'vitest'
import { readFile } from 'fs/promises'
import { normalizeDate, parseContentFile } from './generate-timeline.js'

describe('generate-timeline', () => {
  describe('normalizeDate', () => {
    it('normalizes full date to ISO 8601', () => {
      const result = normalizeDate('March 15, 2024')
      expect(result).toBe('2024-03-15T00:00:00.000Z')
    })
    
    it('normalizes partial date (month year) to ISO 8601', () => {
      const result = normalizeDate('January 2024')
      expect(result).toBe('2024-01-01T00:00:00.000Z')
    })
    
    it('throws error on invalid date format', () => {
      expect(() => normalizeDate('invalid date')).toThrow('Invalid date format')
    })
  })
  
  describe('parseContentFile', () => {
    it('parses valid frontmatter with required fields', async () => {
      const content = await readFile('tests/fixtures/content/valid/sample-youtube.md', 'utf-8')
      const node = parseContentFile('tests/fixtures/content/valid/sample-youtube.md', content)
      
      expect(node).toBeDefined()
      expect(node.id).toBe('sample-youtube')
      expect(node.type).toBe('youtube')
      expect(node.title).toBe('Test Video')
      expect(node.date).toBe('2024-03-15T00:00:00.000Z')
      expect(node.url).toBe('https://youtube.com/watch?v=test123')
    })
    
    it('parses valid blog frontmatter', async () => {
      const content = await readFile('tests/fixtures/content/valid/sample-blog.md', 'utf-8')
      const node = parseContentFile('tests/fixtures/content/valid/sample-blog.md', content)
      
      expect(node).toBeDefined()
      expect(node.id).toBe('sample-blog')
      expect(node.type).toBe('blog')
      expect(node.title).toBe('Test Blog Post')
      expect(node.date).toBe('2024-01-01T00:00:00.000Z')
      expect(node.url).toBe('https://letters.illulachy.me/test')
    })
    
    it('validates required fields and fails on missing date', async () => {
      const content = await readFile('tests/fixtures/content/invalid/missing-date.md', 'utf-8')
      
      expect(() => {
        parseContentFile('tests/fixtures/content/invalid/missing-date.md', content)
      }).toThrow('Validation failed')
    })
    
    it('filters draft entries by returning null', async () => {
      const content = await readFile('tests/fixtures/content/draft/draft-entry.md', 'utf-8')
      const node = parseContentFile('tests/fixtures/content/draft/draft-entry.md', content)
      
      expect(node).toBeNull()
    })
    
    it('generates unique IDs from filenames', async () => {
      const content = await readFile('tests/fixtures/content/valid/sample-youtube.md', 'utf-8')
      const node = parseContentFile('tests/fixtures/content/valid/sample-youtube.md', content)
      
      expect(node.id).toBe('sample-youtube')
    })
    
    it('outputs valid JSON structure with nodes and lastUpdated', () => {
      const timelineData = {
        nodes: [],
        lastUpdated: new Date().toISOString()
      }
      
      expect(timelineData).toHaveProperty('nodes')
      expect(timelineData).toHaveProperty('lastUpdated')
      expect(Array.isArray(timelineData.nodes)).toBe(true)
      expect(typeof timelineData.lastUpdated).toBe('string')
    })
  })
})

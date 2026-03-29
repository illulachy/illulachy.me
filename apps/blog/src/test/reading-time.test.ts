import { describe, it, expect } from 'vitest'
import { calcReadingTime } from '../lib/reading-time'

describe('calcReadingTime', () => {
  it('returns "1 min read" for 200 words', () => {
    const text = Array(200).fill('word').join(' ')
    expect(calcReadingTime(text)).toBe('1 min read')
  })

  it('returns "2 min read" for 400 words', () => {
    const text = Array(400).fill('word').join(' ')
    expect(calcReadingTime(text)).toBe('2 min read')
  })

  it('returns "3 min read" for 600 words', () => {
    const text = Array(600).fill('word').join(' ')
    expect(calcReadingTime(text)).toBe('3 min read')
  })

  it('returns minimum "1 min read" for short text', () => {
    expect(calcReadingTime('hello world')).toBe('1 min read')
  })

  it('returns "1 min read" for empty string', () => {
    expect(calcReadingTime('')).toBe('1 min read')
  })

  it('rounds to nearest minute (350 words -> 2 min)', () => {
    const text = Array(350).fill('word').join(' ')
    expect(calcReadingTime(text)).toBe('2 min read')
  })
})

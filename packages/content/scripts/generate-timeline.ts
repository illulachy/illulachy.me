#!/usr/bin/env tsx
import matter from 'gray-matter'
import fg from 'fast-glob'
import { z } from 'zod'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { basename } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'
import type { ContentNode, TimelineData } from '../src/types/content.js'
import { aboutSchema, type AboutData } from '../src/types/about.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(__dirname, '../../..')

// Zod schema for frontmatter validation
const frontmatterSchema = z.object({
  type: z.string(),           // Free-form, not enum
  title: z.string(),
  date: z.string(),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  draft: z.boolean().optional().default(false),
  institution: z.string().optional(),
  tech: z.string().optional(),
  description: z.string().optional(),
})

type Frontmatter = z.infer<typeof frontmatterSchema>

/**
 * Normalize date string to ISO 8601 format
 * Handles partial dates like "January 2024" or "March 15, 2024"
 */
export function normalizeDate(dateStr: string): string {
  // Add UTC to ensure consistent timezone handling
  const date = new Date(dateStr + ' UTC')

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  return date.toISOString()
}

/**
 * Parse a content file and return ContentNode
 */
export function parseContentFile(filepath: string, content: string): ContentNode {
  // Parse frontmatter with gray-matter
  const parsed = matter(content)

  if (parsed.isEmpty) {
    throw new Error('File has no frontmatter')
  }

  // Validate with zod
  const result = frontmatterSchema.safeParse(parsed.data)

  if (!result.success) {
    const errors = result.error.issues?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || result.error.message
    throw new Error(`Validation failed: ${errors}`)
  }

  const data: Frontmatter = result.data

  // Skip draft entries
  if (data.draft) {
    return null as any // Will be filtered out
  }

  // Generate ID from filename (without .md extension)
  const id = basename(filepath, '.md')

  // Normalize date to ISO 8601
  const normalizedDate = normalizeDate(data.date)

  // Build ContentNode with all fields
  const node: ContentNode = {
    id,
    type: data.type,
    title: data.title,
    date: normalizedDate,
  }

  // Add optional fields if present
  if (data.url) node.url = data.url
  if (data.thumbnail) node.thumbnail = data.thumbnail
  if (data.description) node.description = data.description
  if (data.institution) node.institution = data.institution
  if (data.tech) node.tech = data.tech

  return node
}

/**
 * Process about.md file and return AboutData
 */
export async function processAboutFile(): Promise<AboutData> {
  try {
    const content = await readFile(path.join(PACKAGE_ROOT, 'content/about.md'), 'utf-8')
    const parsed = matter(content)

    if (parsed.isEmpty) {
      throw new Error('about.md has no frontmatter')
    }

    // Validate with zod schema
    const result = aboutSchema.safeParse(parsed.data)

    if (!result.success) {
      const errors = result.error.issues?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || result.error.message
      throw new Error(`Validation failed: ${errors}`)
    }

    return result.data
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\x1b[31m[About] Error processing about.md: ${message}\x1b[0m`)
    throw err
  }
}

async function main() {
  console.log('[Timeline] Generating timeline.json...')

  try {
    // Discover all markdown files in content directory (exclude about.md)
    const files = await fg(path.join(PACKAGE_ROOT, 'content/**/*.md'), {
      ignore: [path.join(PACKAGE_ROOT, 'content/about.md')]
    })

    if (files.length === 0) {
      console.log('[Timeline] No content files found')
    }

    const nodes: ContentNode[] = []
    const seenIds = new Set<string>()

    // Process each file
    for (const filepath of files) {
      try {
        const content = await readFile(filepath, 'utf-8')
        const node = parseContentFile(filepath, content)

        // Skip draft entries (parseContentFile returns null for drafts)
        if (!node) {
          console.log(`[Timeline] Skipped draft: ${filepath}`)
          continue
        }

        // Check for duplicate IDs
        if (seenIds.has(node.id)) {
          throw new Error(`Duplicate ID found: ${node.id} (in ${filepath})`)
        }
        seenIds.add(node.id)

        nodes.push(node)
        console.log(`[Timeline] Parsed: ${filepath} → ${node.id}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`\x1b[31m[Timeline] Error in ${filepath}: ${message}\x1b[0m`)
        process.exit(1)
      }
    }

    // Sort by date (chronological, oldest first)
    nodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Build timeline data
    const timelineData: TimelineData = {
      nodes,
      lastUpdated: new Date().toISOString(),
    }

    // Ensure output directory exists
    await mkdir(path.join(REPO_ROOT, 'apps/portfolio/public'), { recursive: true })

    // Write to apps/portfolio/public/timeline.json (pretty-printed)
    await writeFile(
      path.join(REPO_ROOT, 'apps/portfolio/public/timeline.json'),
      JSON.stringify(timelineData, null, 2),
      'utf-8'
    )

    console.log(`[Timeline] ✓ Generated timeline.json with ${nodes.length} entries`)

    // Process about.md and generate about.json
    console.log('[About] Processing about.md...')
    const aboutData = await processAboutFile()

    await writeFile(
      path.join(REPO_ROOT, 'apps/portfolio/public/about.json'),
      JSON.stringify(aboutData, null, 2),
      'utf-8'
    )

    console.log(`[About] ✓ Generated about.json`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\x1b[31m[Timeline] Fatal error: ${message}\x1b[0m`)
    process.exit(1)
  }
}

main()

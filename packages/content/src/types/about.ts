import { z } from 'zod'

/**
 * AboutData type definition for the portfolio hub node
 * Loaded from content/about.md frontmatter
 */

export const aboutSchema = z.object({
  name: z.string(),
  title: z.string(),
  bio: z.string(),
  avatar: z.string().optional(),
  email: z.string().email().optional(),
  social: z.object({
    github: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
})

export type AboutData = z.infer<typeof aboutSchema>

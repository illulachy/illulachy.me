/**
 * Custom shape utilities for tldraw
 * Exports all shape utils as an array for registration with tldraw editor
 */

import { HubUtil } from './HubShape'
import { YouTubeNodeUtil } from './YouTubeNodeShape'
import { BlogNodeUtil } from './BlogNodeShape'
import { ProjectNodeUtil } from './ProjectNodeShape'
import { MilestoneNodeUtil } from './MilestoneNodeShape'

/**
 * Array of all custom shape utils
 * Pass this to Tldraw component's shapeUtils prop
 */
export const customShapeUtils = [
  HubUtil,
  YouTubeNodeUtil,
  BlogNodeUtil,
  ProjectNodeUtil,
  MilestoneNodeUtil,
] as const

// Individual exports for direct access if needed
export { HubUtil, YouTubeNodeUtil, BlogNodeUtil, ProjectNodeUtil, MilestoneNodeUtil }

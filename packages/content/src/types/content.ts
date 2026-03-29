// Phase 2+ content types (defined now for forward compatibility)
// Free-form string for extensibility (not locked to specific types)
export type ContentType = string

export interface ContentNode {
  id: string
  type: ContentType
  title: string
  date: string  // ISO 8601
  url?: string
  thumbnail?: string
  description?: string
  // Type-specific optional fields
  institution?: string  // for milestone entries
  tech?: string         // for project entries
}

export interface TimelineData {
  nodes: ContentNode[]
  lastUpdated: string
}

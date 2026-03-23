import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
} from 'tldraw'
import type { RecordProps, TLShape } from 'tldraw'
import { useState } from 'react'

// Shape type constant
const BLOG_NODE_TYPE = 'blog-node'

// Module augmentation for tldraw type system
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'blog-node': {
      w: number
      h: number
      nodeId: string
      title: string
      url: string
      date: string
      description?: string
    }
  }
}

// Shape type
type BlogNodeShape = TLShape<typeof BLOG_NODE_TYPE>

/**
 * Blog Node Shape
 * Blog/note content node with document aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export class BlogNodeUtil extends BaseBoxShapeUtil<BlogNodeShape> {
  static override type = BLOG_NODE_TYPE as typeof BLOG_NODE_TYPE
  
  static override props: RecordProps<BlogNodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    title: T.string,
    url: T.string,
    date: T.string,
    description: T.string.optional(),
  }
  
  getDefaultProps(): BlogNodeShape['props'] {
    return {
      w: 280,
      h: 200,
      nodeId: '',
      title: '',
      url: '',
      date: '',
      description: undefined,
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  override onClick(shape: BlogNodeShape) {
    window.open(shape.props.url, '_blank', 'noopener,noreferrer')
  }
  
  component(shape: BlogNodeShape) {
    const { title, date, description } = shape.props
    const [isHovered, setIsHovered] = useState(false)
    
    // Format date nicely (extract just the date part)
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: isHovered 
            ? '1px solid var(--interactive-hover)'
            : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
          overflow: 'hidden',
          cursor: 'pointer',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'all var(--motion-hover)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--spacing-4)',
          gap: 'var(--spacing-3)',
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Document icon */}
        <div style={{
          fontSize: '48px',
          color: 'var(--interactive-default)',
          lineHeight: 1,
        }}>
          📝
        </div>
        
        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 'var(--leading-tight)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </h3>
        
        {/* Date */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
        }}>
          <span>📅</span>
          <span>{formattedDate}</span>
        </div>
        
        {/* Description */}
        {description && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 'var(--leading-normal)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            flex: 1,
          }}>
            {description}
          </p>
        )}
        
        {/* Page corner fold effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 30px 30px 0',
          borderColor: 'transparent var(--surface-container) transparent transparent',
          opacity: 0.5,
        }} />
      </HTMLContainer>
    )
  }
  
  indicator(shape: BlogNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

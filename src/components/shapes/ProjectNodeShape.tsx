import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
} from 'tldraw'
import type { RecordProps, TLShape } from 'tldraw'
import { useState } from 'react'

// Shape type constant
const PROJECT_NODE_TYPE = 'project-node'

// Module augmentation for tldraw type system
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'project-node': {
      w: number
      h: number
      nodeId: string
      title: string
      url: string
      thumbnail?: string
      date: string
      tech?: string
    }
  }
}

// Shape type
type ProjectNodeShape = TLShape<typeof PROJECT_NODE_TYPE>

/**
 * Project Node Shape
 * Project content node with code/terminal window aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export class ProjectNodeUtil extends BaseBoxShapeUtil<ProjectNodeShape> {
  static override type = PROJECT_NODE_TYPE as typeof PROJECT_NODE_TYPE
  
  static override props: RecordProps<ProjectNodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    title: T.string,
    url: T.string,
    thumbnail: T.string.optional(),
    date: T.string,
    tech: T.string.optional(),
  }
  
  getDefaultProps(): ProjectNodeShape['props'] {
    return {
      w: 280,
      h: 200,
      nodeId: '',
      title: '',
      url: '',
      thumbnail: undefined,
      date: '',
      tech: undefined,
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  override onClick(shape: ProjectNodeShape) {
    window.open(shape.props.url, '_blank', 'noopener,noreferrer')
  }
  
  component(shape: ProjectNodeShape) {
    const { title, thumbnail, tech } = shape.props
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          background: 'var(--surface-container-low)',
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
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Window chrome header */}
        <div style={{
          width: '100%',
          height: '24px',
          background: 'var(--surface-container-highest)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--spacing-2)',
          gap: 'var(--spacing-1)',
          borderBottom: '1px solid var(--border-ghost)',
        }}>
          {/* Window dots */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
        </div>
        
        {/* Thumbnail or code aesthetic */}
        <div style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          background: 'var(--surface-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {thumbnail ? (
            <>
              {!imageLoaded && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--surface-dim) 0%, var(--surface-container) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '48px', opacity: 0.3 }}>{'{ }'}</span>
                </div>
              )}
              <img
                src={thumbnail}
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoaded ? 'block' : 'none',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity var(--motion-hover)',
                }}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '48px',
              color: 'white',
              opacity: 0.9,
            }}>
              {'{ }'}
            </div>
          )}
        </div>
        
        {/* Title bar with code brackets */}
        <div style={{
          width: '100%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          padding: 'var(--spacing-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          borderTop: '1px solid var(--border-ghost)',
        }}>
          {/* Code icon */}
          <div style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--interactive-default)',
            fontFamily: 'var(--font-mono)',
          }}>
            {'</>'}
          </div>
          
          {/* Title */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--leading-tight)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {title}
          </p>
        </div>
        
        {/* Tech stack badge */}
        {tech && (
          <div style={{
            position: 'absolute',
            top: '32px',
            right: 'var(--spacing-2)',
            padding: '4px 8px',
            background: 'var(--interactive-bg-medium)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-default)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--interactive-default)',
            fontWeight: 'var(--font-weight-medium)',
          }}>
            {tech}
          </div>
        )}
      </HTMLContainer>
    )
  }
  
  indicator(shape: ProjectNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
} from 'tldraw'
import type { RecordProps, TLShape } from 'tldraw'
import { useState } from 'react'

// Shape type constant
const YOUTUBE_NODE_TYPE = 'youtube-node'

// Module augmentation for tldraw type system
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'youtube-node': {
      w: number
      h: number
      nodeId: string
      title: string
      url: string
      thumbnail?: string
      date: string
      tech?: string
      institution?: string
      description?: string
    }
  }
}

// Shape type
type YouTubeNodeShape = TLShape<typeof YOUTUBE_NODE_TYPE>

/**
 * YouTube Node Shape
 * Video content node with thumbnail and play button aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export class YouTubeNodeUtil extends BaseBoxShapeUtil<YouTubeNodeShape> {
  static override type = YOUTUBE_NODE_TYPE as typeof YOUTUBE_NODE_TYPE
  
  static override props: RecordProps<YouTubeNodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    title: T.string,
    url: T.string,
    thumbnail: T.string.optional(),
    date: T.string,
    tech: T.string.optional(),
    institution: T.string.optional(),
    description: T.string.optional(),
  }
  
  getDefaultProps(): YouTubeNodeShape['props'] {
    return {
      w: 280,
      h: 200,
      nodeId: '',
      title: '',
      url: '',
      thumbnail: undefined,
      date: '',
      tech: undefined,
      institution: undefined,
      description: undefined,
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  override onClick(shape: YouTubeNodeShape) {
    window.open(shape.props.url, '_blank', 'noopener,noreferrer')
  }
  
  component(shape: YouTubeNodeShape) {
    const { title, thumbnail } = shape.props
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
        {/* Thumbnail area (70% height) */}
        <div style={{
          width: '100%',
          height: '70%',
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
                  background: 'linear-gradient(135deg, var(--surface-container) 0%, var(--surface-container-high) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '48px', opacity: 0.3 }}>▶</span>
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
              background: 'linear-gradient(135deg, #E01563 0%, #E0AFFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '48px', color: 'white', opacity: 0.9 }}>▶</span>
            </div>
          )}
          
          {/* Play button overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(224, 175, 255, 0.3)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered ? 1 : 0.7,
            transition: 'opacity var(--motion-hover)',
          }}>
            <span style={{ fontSize: '24px', color: 'white' }}>▶</span>
          </div>
        </div>
        
        {/* Title bar with video player aesthetic */}
        <div style={{
          width: '100%',
          height: '30%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          padding: 'var(--spacing-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          borderTop: '1px solid var(--border-ghost)',
        }}>
          {/* Video icon */}
          <div style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--interactive-default)',
          }}>
            📹
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
        
        {/* Simulated video scrubber bar at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            width: '0%',
            height: '100%',
            background: 'var(--interactive-default)',
          }} />
        </div>
      </HTMLContainer>
    )
  }
  
  indicator(shape: YouTubeNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

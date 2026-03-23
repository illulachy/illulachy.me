import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
} from 'tldraw'
import type { RecordProps, TLShape } from 'tldraw'
import { useState } from 'react'

// Shape type constant
const HUB_SHAPE_TYPE = 'hub-shape'

// Module augmentation for tldraw type system
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'hub-shape': {
      w: number
      h: number
      name: string
      title: string
      bio: string
      avatar?: string
      social?: {
        github?: string
        twitter?: string
        linkedin?: string
        youtube?: string
      }
    }
  }
}

// Shape type
type HubShape = TLShape<typeof HUB_SHAPE_TYPE>

/**
 * Portfolio Hub Shape
 * Central node displaying "about me" content
 * Size: 640x360px (16:9 aspect ratio)
 */
export class HubUtil extends BaseBoxShapeUtil<HubShape> {
  static override type = HUB_SHAPE_TYPE as typeof HUB_SHAPE_TYPE
  
  static override props: RecordProps<HubShape> = {
    w: T.number,
    h: T.number,
    name: T.string,
    title: T.string,
    bio: T.string,
    avatar: T.string.optional(),
    social: T.jsonValue.optional() as any,
  }
  
  getDefaultProps(): HubShape['props'] {
    return {
      w: 640,
      h: 360,
      name: '',
      title: '',
      bio: '',
      avatar: undefined,
      social: undefined,
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  component(shape: HubShape) {
    const { name, title, bio, avatar, social } = shape.props
    const [isHovered, setIsHovered] = useState(false)
    
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
            : '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--spacing-6)',
          gap: 'var(--spacing-4)',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'all var(--motion-hover)',
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        {avatar && (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid var(--border-subtle)',
          }}>
            <img
              src={avatar}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        
        {/* Name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-4xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 'var(--leading-tight)',
        }}>
          {name}
        </h1>
        
        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 'var(--leading-snug)',
        }}>
          {title}
        </h2>
        
        {/* Bio */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 'var(--leading-normal)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {bio}
        </p>
        
        {/* Social icons row */}
        {social && (
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-3)',
            marginTop: 'auto',
          }}>
            {social.github && (
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}>
                GitHub
              </div>
            )}
            {social.twitter && (
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}>
                Twitter
              </div>
            )}
            {social.linkedin && (
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}>
                LinkedIn
              </div>
            )}
            {social.youtube && (
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}>
                YouTube
              </div>
            )}
          </div>
        )}
      </HTMLContainer>
    )
  }
  
  indicator(shape: HubShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

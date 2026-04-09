import { Group } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useState } from 'react'

interface ProjectNodeProps {
  x: number
  y: number
  id: string
  title: string
  url: string
  date: string
  thumbnail?: string
  description?: string
  tech?: string
  institution?: string
  isActive?: boolean
}

/**
 * Project Node
 * Code/app project content node with code editor aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export function ProjectNode({ x, y, title, url, thumbnail, tech, isActive }: ProjectNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  
  return (
    <Group x={x} y={y}>
      <Html>
        <div
          style={{
            width: '280px',
            height: '200px',
            pointerEvents: 'all',
            background: 'var(--surface-container-low)',
            backdropFilter: 'blur(var(--glass-blur))',
            border: isActive
              ? '1px solid var(--interactive-default)'
              : isHovered
              ? '1px solid var(--interactive-hover)'
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: isActive
              ? '0 0 0 2px var(--interactive-default), var(--shadow-lg)'
              : isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'all var(--motion-hover)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          onClick={handleClick}
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
            height: '120px',
            width: '100%',
            position: 'relative',
            background: 'var(--surface-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
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
                  width="280"
                  height="120"
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
              {'{ }'}
            </div>
            
            {/* Title */}
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 'var(--leading-tight)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {title}
            </h3>
            
            {/* Tech badge */}
            {tech && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                background: 'var(--surface-container-highest)',
                padding: '2px var(--spacing-2)',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}>
                {tech.split(',')[0].trim()}
              </div>
            )}
          </div>
        </div>
      </Html>
    </Group>
  )
}

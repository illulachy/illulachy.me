import { Group } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useState } from 'react'

interface YouTubeNodeProps {
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
 * YouTube Node
 * YouTube video content node with video player aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export function YouTubeNode({ x, y, title, url, thumbnail, isActive }: YouTubeNodeProps) {
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
            {/* Play icon */}
            <div style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--interactive-default)',
            }}>
              ▶
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
          </div>
        </div>
      </Html>
    </Group>
  )
}

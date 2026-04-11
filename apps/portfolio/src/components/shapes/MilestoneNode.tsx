import { Group } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useState } from 'react'

interface MilestoneNodeProps {
  x: number
  y: number
  id: string
  title: string
  date: string
  institution?: string
  description?: string
  thumbnail?: string
  tech?: string
  isActive?: boolean
  icon?: string
}

/**
 * Milestone Node
 * Milestone/education content node with achievement badge aesthetic
 * Size: 280x200px (uniform timeline node size)
 * Click behavior: Dispatches custom event to show modal
 */
export function MilestoneNode({ x, y, id, title, date, institution, isActive, icon = '🏆' }: MilestoneNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  return (
    <Group x={x} y={y}>
      <Html>
        <div
          style={{
            width: '280px',
            height: '200px',
            pointerEvents: 'all',
            background: 'var(--glass-bg)',
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
            padding: 'var(--spacing-4)',
            gap: 'var(--spacing-3)',
            position: 'relative',
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* Achievement badge icon */}
          <div style={{
            fontSize: '56px',
            lineHeight: 1,
            textAlign: 'center',
          }}>
            {icon}
          </div>
          
          {/* Title */}
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--leading-tight)',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {title}
          </h3>
          
          {/* Institution */}
          {institution && (
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {institution}
            </div>
          )}
          
          {/* Date */}
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-2)',
            marginTop: 'auto',
          }}>
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
          
          {/* Star decorations */}
          <div style={{
            position: 'absolute',
            top: 'var(--spacing-2)',
            left: 'var(--spacing-2)',
            fontSize: 'var(--text-lg)',
            opacity: 0.5,
          }}>
            ⭐
          </div>
          <div style={{
            position: 'absolute',
            top: 'var(--spacing-2)',
            right: 'var(--spacing-2)',
            fontSize: 'var(--text-lg)',
            opacity: 0.5,
          }}>
            ⭐
          </div>
          
          {/* Ribbon effect at bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '4px',
            background: 'linear-gradient(90deg, transparent 0%, var(--interactive-default) 50%, transparent 100%)',
            opacity: 0.6,
          }} />
        </div>
      </Html>
    </Group>
  )
}

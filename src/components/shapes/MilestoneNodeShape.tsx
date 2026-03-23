import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
} from 'tldraw'
import type { RecordProps, TLShape } from 'tldraw'
import { useState } from 'react'

// Shape type constant
const MILESTONE_NODE_TYPE = 'milestone-node'

// Module augmentation for tldraw type system
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'milestone-node': {
      w: number
      h: number
      nodeId: string
      title: string
      date: string
      institution?: string
      description?: string
      thumbnail?: string
      tech?: string
    }
  }
}

// Shape type
type MilestoneNodeShape = TLShape<typeof MILESTONE_NODE_TYPE>

/**
 * Milestone Node Shape
 * Milestone/education content node with achievement badge aesthetic
 * Size: 280x200px (uniform timeline node size)
 * Click behavior: Dispatches custom event to show modal
 */
export class MilestoneNodeUtil extends BaseBoxShapeUtil<MilestoneNodeShape> {
  static override type = MILESTONE_NODE_TYPE as typeof MILESTONE_NODE_TYPE
  
  static override props: RecordProps<MilestoneNodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    title: T.string,
    date: T.string,
    institution: T.string.optional(),
    description: T.string.optional(),
    thumbnail: T.string.optional(),
    tech: T.string.optional(),
  }
  
  getDefaultProps(): MilestoneNodeShape['props'] {
    return {
      w: 280,
      h: 200,
      nodeId: '',
      title: '',
      date: '',
      institution: undefined,
      description: undefined,
      thumbnail: undefined,
      tech: undefined,
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  override onClick(shape: MilestoneNodeShape) {
    // Dispatch custom event for modal display
    window.dispatchEvent(new CustomEvent('openMilestoneModal', { 
      detail: { 
        nodeId: shape.props.nodeId,
        title: shape.props.title,
        date: shape.props.date,
        institution: shape.props.institution,
        description: shape.props.description,
      } 
    }))
  }
  
  component(shape: MilestoneNodeShape) {
    const { title, date, institution } = shape.props
    const [isHovered, setIsHovered] = useState(false)
    
    // Format date nicely
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
          🏆
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
      </HTMLContainer>
    )
  }
  
  indicator(shape: MilestoneNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

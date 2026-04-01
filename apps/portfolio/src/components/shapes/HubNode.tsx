import { Group } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useState } from 'react'

interface HubNodeProps {
  x: number
  y: number
  name: string
  title: string
  bio: string
  avatar?: string
  email?: string
  lastUpdated?: string
  social?: {
    github?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
}

const HUB_WIDTH = 880
const HUB_HEIGHT = 480
const AVATAR_WIDTH = 380

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

/**
 * Portfolio Hub Node
 * Central node displaying "about me" content
 * Size: 880x480px — 2-column layout (portrait avatar left, bio/social right)
 */
export function HubNode({ x, y, name, title, bio, avatar, email, lastUpdated, social }: HubNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const updatedLabel = lastUpdated ? formatUpdated(lastUpdated) : null

  return (
    <Group x={x} y={y}>
      <Html>
        <div
          style={{
            width: `${HUB_WIDTH}px`,
            height: `${HUB_HEIGHT}px`,
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
            flexDirection: 'row',
            transform: isHovered ? 'scale(1.01)' : 'scale(1)',
            transition: 'all var(--motion-hover)',
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* Left column — portrait avatar */}
          <div
            style={{
              width: `${AVATAR_WIDTH}px`,
              flexShrink: 0,
              height: '100%',
              overflow: 'hidden',
              background: 'rgba(28, 28, 28, 0.6)',
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              /* Placeholder gradient when no avatar */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(160deg, rgba(224,175,255,0.15) 0%, rgba(28,28,28,0.4) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  opacity: 0.4,
                }}
              >
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Right column — content */}
          <div
            style={{
              flex: 1,
              padding: '28px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            {/* Name */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.4rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: '0 0 4px',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {name}
            </h1>

            {/* Title */}
            <h2
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                margin: '0 0 16px',
                lineHeight: 'var(--leading-snug)',
              }}
            >
              {title}
            </h2>

            {/* Bio */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 'var(--leading-relaxed)',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              {bio}
            </p>

            {/* Footer — social links + updated */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-3)',
              }}
            >
              {/* Social links */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {social?.github && (
                  <a
                    href={`https://github.com/${social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-body)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color var(--motion-hover)',
                    }}
                    onPointerEnter={(e) => { e.currentTarget.style.color = 'var(--interactive-hover)' }}
                    onPointerLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {social?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-body)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color var(--motion-hover)',
                    }}
                    onPointerEnter={(e) => { e.currentTarget.style.color = 'var(--interactive-hover)' }}
                    onPointerLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-body)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color var(--motion-hover)',
                    }}
                    onPointerEnter={(e) => { e.currentTarget.style.color = 'var(--interactive-hover)' }}
                    onPointerLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Email
                  </a>
                )}
              </div>

              {/* Updated timestamp */}
              {updatedLabel && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-body)',
                    opacity: 0.6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Updated {updatedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </Html>
    </Group>
  )
}

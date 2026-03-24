/**
 * Spaceship cursor overlay component
 * Phase 6: Game Mode (GAME-02)
 */

import { motion } from 'motion/react'

interface SpaceshipCursorProps {
  x: number // screen pixels
  y: number // screen pixels
  rotation: number // radians
}

/**
 * SVG spaceship cursor that overlays the canvas
 * Rotates to face movement direction
 */
export function SpaceshipCursor({ x, y, rotation }: SpaceshipCursorProps) {
  const SIZE = 40 // px
  return (
    <motion.div
      className="fixed pointer-events-none z-[400]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: SIZE,
        height: SIZE,
      }}
      animate={{
        x: '-50%',
        y: '-50%',
        rotate: `${rotation}rad`,
        opacity: 1,
        scale: 1,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox="0 0 56 56"
        className="filter drop-shadow-[0_0_8px_var(--interactive-hover)]"
      >
        {/* Simple triangle spaceship pointing right (0 rad) */}
        <path
          d="M 42 28 L 14 14 L 20 28 L 14 42 Z"
          fill="var(--interactive-hover)"
          stroke="var(--surface-7)"
          strokeWidth="2"
        />
        {/* Exhaust glow */}
        <circle
          cx="18"
          cy="28"
          r="4"
          fill="var(--interactive-hover)"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  )
}

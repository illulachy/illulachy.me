import { motion } from "motion/react";

interface GameModeHintProps {
  isGameMode: boolean;
}

/**
 * Decorative bottom-right hint prompting the user to toggle Game Mode (the
 * spaceship cursor) with the G key. Label flips based on current mode.
 */
export function GameModeHint({ isGameMode }: GameModeHintProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px 8px 12px",
        borderRadius: 12,
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1,
        color: "#52525B",
        background: "rgba(255, 255, 255, 0.7)",
        border: "1px solid rgba(224, 175, 255, 0.35)",
        boxShadow: "0 4px 20px rgba(224, 175, 255, 0.18)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <motion.span
        aria-hidden
        animate={
          isGameMode
            ? { rotate: [0, -8, 8, 0], y: [0, -2, 0] }
            : { rotate: 0, y: 0 }
        }
        transition={{
          duration: 1.6,
          repeat: isGameMode ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ fontSize: 15, color: "#D197FF" }}
      >
        ▲
      </motion.span>

      <span>Press</span>

      <kbd
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: "#D197FF",
          background: "rgba(224, 175, 255, 0.12)",
          border: "1px solid rgba(224, 175, 255, 0.4)",
          borderRadius: 6,
          padding: "3px 8px",
          boxShadow: "0 1px 0 rgba(224, 175, 255, 0.3)",
        }}
      >
        G
      </kbd>

      <span style={{ color: "#71717A" }}>
        {isGameMode ? "to land the spaceship" : "to fly the spaceship"}
      </span>
    </motion.div>
  );
}

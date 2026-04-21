import { Group } from "react-konva";
import { Html } from "react-konva-utils";
import { useState } from "react";

interface BlogNodeProps {
  x: number;
  y: number;
  id: string;
  title: string;
  url: string;
  date: string;
  description?: string;
  thumbnail?: string;
  tech?: string;
  institution?: string;
  isActive?: boolean;
}

/**
 * Blog Node
 * Blog/note content node with document aesthetic
 * Size: 280x200px (uniform timeline node size)
 */
export function BlogNode({
  x,
  y,
  title,
  url,
  date,
  description,
  isActive,
}: BlogNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Group x={x} y={y}>
      <Html>
        <div
          style={{
            width: "280px",
            height: "200px",
            pointerEvents: "all",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur))",
            border: isActive
              ? "1px solid var(--interactive-default)"
              : isHovered
                ? "1px solid var(--interactive-hover)"
                : "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            boxShadow: isActive
              ? "0 0 0 2px var(--interactive-default), var(--shadow-lg)"
              : isHovered
                ? "var(--shadow-lg)"
                : "var(--shadow-md)",
            overflow: "hidden",
            cursor: "pointer",
            transform: isHovered ? "scale(1.02)" : "scale(1)",
            transition: "all var(--motion-hover)",
            display: "flex",
            flexDirection: "column",
            padding: "var(--spacing-4)",
            gap: "var(--spacing-3)",
            position: "relative",
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          {/* Document icon */}

          {/* Title */}
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: "var(--leading-tight)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </h3>

          {/* Date */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-2)",
            }}
          >
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>

          {/* Description */}
          {description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: "var(--leading-normal)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                flex: 1,
              }}
            >
              {description}
            </p>
          )}

          {/* Page corner fold effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "0 30px 30px 0",
              borderColor:
                "transparent var(--surface-container) transparent transparent",
              opacity: 0.5,
            }}
          />
        </div>
      </Html>
    </Group>
  );
}

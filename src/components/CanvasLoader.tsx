export function CanvasLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-canvas-bg">
      {/* Ghost hub shape - 16:9 aspect ratio */}
      <div className="relative animate-pulse w-[min(640px,80vw)] aspect-video">
        <div className="w-full h-full rounded-lg bg-surface-container-low border border-border-ghost opacity-40" />
      </div>
    </div>
  )
}

export function CanvasLoader() {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--canvas-bg)' }}
    >
      {/* Ghost hub shape - 16:9 aspect ratio */}
      <div 
        className="relative animate-pulse"
        style={{
          width: 'min(640px, 80vw)',
          aspectRatio: '16 / 9',
        }}
      >
        <div 
          className="w-full h-full rounded-lg"
          style={{
            background: 'var(--surface-container-low)',
            border: '1px solid var(--border-ghost)',
            opacity: 0.4,
          }}
        />
      </div>
      {/* Overlay prevents interaction */}
      <div className="absolute inset-0 pointer-events-auto" />
    </div>
  )
}

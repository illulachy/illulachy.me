import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export function CanvasTest() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        hideUi
        onMount={(editor) => {
          console.log('Editor mounted:', editor)
          console.log('Camera:', editor.getCamera())
          editor.setCamera({ x: 0, y: 0, z: 1 })
          console.log('Camera after setCamera:', editor.getCamera())
        }}
      />
    </div>
  )
}

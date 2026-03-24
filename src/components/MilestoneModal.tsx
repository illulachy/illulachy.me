import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ContentNode } from '@/types/content'

interface MilestoneModalProps {
  node: ContentNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MilestoneModal({ node, open, onOpenChange }: MilestoneModalProps) {
  if (!node) return null

  const formattedDate = new Date(node.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass rounded-2xl p-8 max-w-md">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className={cn(
            'absolute top-4 right-4 text-2xl text-secondary',
            'hover:text-primary transition-colors duration-150',
            'bg-transparent border-none cursor-pointer leading-none p-1'
          )}
          aria-label="Close modal"
        >
          ×
        </button>

        <DialogHeader>
          {/* Achievement icon */}
          <div className="text-5xl mb-4">🏆</div>
          
          <DialogTitle className="font-heading text-2xl text-primary pr-8 mb-2">
            {node.title}
          </DialogTitle>
        </DialogHeader>

        {/* Date */}
        <p className="text-sm text-tertiary mb-2">{formattedDate}</p>

        {/* Institution */}
        {node.institution && (
          <p className="text-base text-interactive mb-4">{node.institution}</p>
        )}

        {/* Description */}
        {node.description && (
          <p className="text-base text-secondary leading-relaxed">{node.description}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

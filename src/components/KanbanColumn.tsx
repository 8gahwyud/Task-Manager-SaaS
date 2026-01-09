'use client'

import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'w-80 flex-shrink-0 flex flex-col bg-surface-50/30 rounded-xl',
        isOver && 'ring-2 ring-accent/30'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-zinc-200">{title}</h3>
          <span className="text-sm text-zinc-500 bg-surface-200 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
        {children}
      </div>
    </div>
  )
}


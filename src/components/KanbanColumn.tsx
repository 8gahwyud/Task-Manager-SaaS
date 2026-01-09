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
        'w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200',
        isOver && 'ring-2 ring-accent/30'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
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



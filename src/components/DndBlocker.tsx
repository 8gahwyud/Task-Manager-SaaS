'use client'

// DndBlocker отключен - он блокировал клики на кнопках
// Проблема с DndContext решается в handleDragStart в KanbanBoard.tsx

export function DndBlocker({ boardContainerId }: { boardContainerId?: string }) {
  // Ничего не делаем - просто возвращаем null
  return null
}

'use client'

import { useEffect } from 'react'

export function DndBlocker({ boardContainerId }: { boardContainerId?: string }) {
  useEffect(() => {
    // Блокируем события от DndContext для элементов вне доски
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Если клик в сайдбаре или header - останавливаем для DndContext
      if (target.closest('aside') || target.closest('header') || target.closest('[data-no-dnd-block]')) {
        // Останавливаем распространение события на уровне capture
        // Это предотвратит его попадание в DndContext
        e.stopImmediatePropagation()
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Если клик в сайдбаре или header - останавливаем для DndContext
      if (target.closest('aside') || target.closest('header') || target.closest('[data-no-dnd-block]')) {
        e.stopImmediatePropagation()
      }
    }

    // Используем capture phase, чтобы перехватить событие до DndContext
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('mousedown', handleMouseDown, true)
    
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [boardContainerId])

  return null
}


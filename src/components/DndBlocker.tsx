'use client'

import { useEffect } from 'react'

export function DndBlocker({ boardContainerId }: { boardContainerId?: string }) {
  useEffect(() => {
    // Блокируем события от DndContext для элементов вне доски
    // Используем самую раннюю фазу capture и останавливаем полностью
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Если клик в сайдбаре, header или любом элементе с data-no-dnd-block
      const isOutside = target.closest('aside') || 
                       target.closest('header') || 
                       target.closest('[data-no-dnd-block]') ||
                       target.closest('nav')
      
      if (isOutside) {
        // Останавливаем только для DndContext, но не блокируем клики
        e.stopImmediatePropagation()
        // НЕ используем preventDefault, чтобы клики работали
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      const isOutside = target.closest('aside') || 
                       target.closest('header') || 
                       target.closest('[data-no-dnd-block]') ||
                       target.closest('nav')
      
      if (isOutside) {
        e.stopImmediatePropagation()
        // НЕ используем preventDefault, чтобы клики работали
      }
    }

    // Используем capture phase с самым высоким приоритетом
    // true означает capture phase, и мы останавливаем событие до того, как оно дойдет до DndContext
    // passive: false чтобы можно было использовать stopImmediatePropagation
    const options = { capture: true, passive: false } as AddEventListenerOptions
    
    document.addEventListener('pointerdown', handlePointerDown, options)
    document.addEventListener('mousedown', handleMouseDown, options)
    document.addEventListener('touchstart', handlePointerDown as any, options)
    
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, options)
      document.removeEventListener('mousedown', handleMouseDown, options)
      document.removeEventListener('touchstart', handlePointerDown as any, options)
    }
  }, [boardContainerId])

  return null
}


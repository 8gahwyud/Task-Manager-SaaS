'use client'

import { useEffect } from 'react'

export function DndBlocker({ boardContainerId }: { boardContainerId?: string }) {
  useEffect(() => {
    // DndBlocker должен работать только на странице проекта с доской
    if (!boardContainerId) {
      return
    }

    const boardContainer = document.getElementById(boardContainerId)
    if (!boardContainer) {
      return
    }
    
    // Блокируем ТОЛЬКО события drag в сайдбаре, чтобы они не активировали DndContext
    // Все остальные клики работают нормально
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Блокируем только сайдбар от активации drag
      const sidebar = target.closest('aside')
      if (sidebar) {
        // Проверяем, что это не клик в доске (который может быть внутри сайдбара технически)
        if (!boardContainer.contains(target)) {
          // Это клик в сайдбаре вне доски - блокируем от DndContext
          e.stopImmediatePropagation()
        }
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Блокируем только сайдбар от активации drag
      const sidebar = target.closest('aside')
      if (sidebar) {
        if (!boardContainer.contains(target)) {
          e.stopImmediatePropagation()
        }
      }
    }

    // Используем capture: true, чтобы перехватить ДО DndContext
    const options: AddEventListenerOptions = { 
      capture: true, 
      passive: false 
    }
    
    // Регистрируем только события drag, не клики
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


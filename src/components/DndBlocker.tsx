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
    
    // Блокируем события от DndContext ТОЛЬКО для сайдбара
    // Все остальные клики (кнопки, ссылки, header) должны работать нормально
    
    const shouldBlockEvent = (target: HTMLElement): boolean => {
      // НИКОГДА не блокируем клики на интерактивных элементах
      if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
        return false
      }
      
      // НИКОГДА не блокируем клики в header
      if (target.closest('header')) {
        return false
      }
      
      // НИКОГДА не блокируем элементы с data-no-dnd-block
      if (target.closest('[data-no-dnd-block]')) {
        return false
      }
      
      // НИКОГДА не блокируем клики в доске
      if (boardContainer.contains(target)) {
        return false
      }
      
      // Блокируем ТОЛЬКО если это клик в сайдбаре
      const sidebar = target.closest('aside')
      if (sidebar) {
        return true
      }
      
      return false
    }
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      if (shouldBlockEvent(target)) {
        // Блокируем только сайдбар от активации DndContext
        e.stopImmediatePropagation()
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      if (shouldBlockEvent(target)) {
        // Блокируем только сайдбар от активации DndContext
        e.stopImmediatePropagation()
      }
    }

    // КРИТИЧНО: используем capture: true и регистрируем как можно раньше
    // Это гарантирует, что наши обработчики будут вызваны ДО обработчиков DndContext
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


'use client'

import { useEffect } from 'react'

export function DndBlocker({ boardContainerId }: { boardContainerId?: string }) {
  useEffect(() => {
    // Блокируем события от DndContext для элементов вне доски
    // Регистрируем в самую раннюю фазу capture ДО того, как DndContext зарегистрирует свои обработчики
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Проверяем, клик ли это в сайдбаре, header или элементе с data-no-dnd-block
      const sidebar = target.closest('aside')
      const header = target.closest('header')
      const noDnd = target.closest('[data-no-dnd-block]')
      const nav = target.closest('nav')
      
      if (sidebar || header || noDnd || nav) {
        // КРИТИЧНО: останавливаем ДО того, как событие дойдет до DndContext
        e.stopImmediatePropagation()
        // НЕ используем preventDefault - это блокирует клики
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      const sidebar = target.closest('aside')
      const header = target.closest('header')
      const noDnd = target.closest('[data-no-dnd-block]')
      const nav = target.closest('nav')
      
      if (sidebar || header || noDnd || nav) {
        e.stopImmediatePropagation()
      }
    }

    // КРИТИЧНО: используем capture: true и регистрируем как можно раньше
    // Это гарантирует, что наши обработчики будут вызваны ДО обработчиков DndContext
    const options: AddEventListenerOptions = { 
      capture: true, 
      passive: false 
    }
    
    // Регистрируем все типы событий, которые может использовать DndContext
    document.addEventListener('pointerdown', handlePointerDown, options)
    document.addEventListener('mousedown', handleMouseDown, options)
    document.addEventListener('touchstart', handlePointerDown as any, options)
    document.addEventListener('click', handleMouseDown as any, options)
    
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, options)
      document.removeEventListener('mousedown', handleMouseDown, options)
      document.removeEventListener('touchstart', handlePointerDown as any, options)
      document.removeEventListener('click', handleMouseDown as any, options)
    }
  }, [boardContainerId])

  return null
}


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
    
    // КРИТИЧНО: Проверяем интерактивные элементы ПЕРВЫМИ и ВОЗВРАЩАЕМСЯ РАНЬШЕ
    // НИКОГДА не вызываем stopImmediatePropagation для интерактивных элементов
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // ПЕРВЫЙ ПРИОРИТЕТ: НИКОГДА не блокируем интерактивные элементы
      // Если это кнопка, ссылка, input или любой интерактивный элемент - ВОЗВРАЩАЕМСЯ
      if (
        target.closest('a') || 
        target.closest('button') || 
        target.closest('input') || 
        target.closest('select') || 
        target.closest('textarea') ||
        target.closest('label') ||
        target.closest('[role="button"]') ||
        target.hasAttribute('onclick')
      ) {
        return // НЕ БЛОКИРУЕМ - пусть React обработчики работают
      }
      
      // ВТОРОЙ ПРИОРИТЕТ: НИКОГДА не блокируем клики в header
      if (target.closest('header')) {
        return
      }
      
      // ТРЕТИЙ ПРИОРИТЕТ: НИКОГДА не блокируем элементы с data-no-dnd-block
      if (target.closest('[data-no-dnd-block]')) {
        return
      }
      
      // ЧЕТВЕРТЫЙ ПРИОРИТЕТ: НИКОГДА не блокируем клики в доске
      if (boardContainer.contains(target)) {
        return
      }
      
      // ТОЛЬКО ПОСЛЕ ВСЕХ ПРОВЕРОК: блокируем клики в сайдбаре (неинтерактивные области)
      const sidebar = target.closest('aside')
      if (sidebar) {
        // Это клик в сайдбаре на неинтерактивном элементе - блокируем от DndContext
        e.stopImmediatePropagation()
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // ПЕРВЫЙ ПРИОРИТЕТ: НИКОГДА не блокируем интерактивные элементы
      if (
        target.closest('a') || 
        target.closest('button') || 
        target.closest('input') || 
        target.closest('select') || 
        target.closest('textarea') ||
        target.closest('label') ||
        target.closest('[role="button"]') ||
        target.hasAttribute('onclick')
      ) {
        return // НЕ БЛОКИРУЕМ
      }
      
      // ВТОРОЙ ПРИОРИТЕТ: НИКОГДА не блокируем клики в header
      if (target.closest('header')) {
        return
      }
      
      // ТРЕТИЙ ПРИОРИТЕТ: НИКОГДА не блокируем элементы с data-no-dnd-block
      if (target.closest('[data-no-dnd-block]')) {
        return
      }
      
      // ЧЕТВЕРТЫЙ ПРИОРИТЕТ: НИКОГДА не блокируем клики в доске
      if (boardContainer.contains(target)) {
        return
      }
      
      // ТОЛЬКО ПОСЛЕ ВСЕХ ПРОВЕРОК: блокируем клики в сайдбаре
      const sidebar = target.closest('aside')
      if (sidebar) {
        e.stopImmediatePropagation()
      }
    }

    // Используем capture: true, чтобы перехватить ДО DndContext
    const options: AddEventListenerOptions = { 
      capture: true, 
      passive: false 
    }
    
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

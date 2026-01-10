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
    
    // Блокируем события от DndContext для элементов вне доски
    // Регистрируем в самую раннюю фазу capture ДО того, как DndContext зарегистрирует свои обработчики
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Проверяем, клик ли это в сайдбаре
      const sidebar = target.closest('aside')
      
      // Также проверяем, что это НЕ клик в области доски (чтобы не блокировать drag-and-drop на доске)
      const isInBoard = boardContainer.contains(target)
      
      // Блокируем только сайдбар И если это не доска
      if (sidebar && !isInBoard) {
        // КРИТИЧНО: останавливаем ДО того, как событие дойдет до DndContext
        e.stopImmediatePropagation()
      }
      
      // Также разрешаем клики в header, links, buttons вне доски
      const isLink = target.closest('a')
      const isButton = target.closest('button')
      const isHeader = target.closest('header')
      const isDataNoDndBlock = target.closest('[data-no-dnd-block]')
      
      // Если это клик на ссылку, кнопку в header, или элемент с data-no-dnd-block и НЕ в доске - разрешаем
      if ((isLink || isButton || isDataNoDndBlock) && (isHeader || !isInBoard)) {
        e.stopImmediatePropagation()
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Проверяем, клик ли это в сайдбаре
      const sidebar = target.closest('aside')
      
      // Также проверяем, что это НЕ клик в области доски
      const isInBoard = boardContainer.contains(target)
      
      // Блокируем только сайдбар И если это не доска
      if (sidebar && !isInBoard) {
        e.stopImmediatePropagation()
      }
      
      // Также разрешаем клики в header, links, buttons вне доски
      const isLink = target.closest('a')
      const isButton = target.closest('button')
      const isHeader = target.closest('header')
      const isDataNoDndBlock = target.closest('[data-no-dnd-block]')
      
      // Если это клик на ссылку, кнопку в header, или элемент с data-no-dnd-block и НЕ в доске - разрешаем
      if ((isLink || isButton || isDataNoDndBlock) && (isHeader || !isInBoard)) {
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


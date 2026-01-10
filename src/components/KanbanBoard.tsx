'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
} from '@dnd-kit/core'

// Кастомный сенсор, который активируется ТОЛЬКО внутри доски
class RestrictedMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: MouseEvent }) => {
        const target = event.target as HTMLElement
        
        // Проверяем, что клик внутри board-container
        const board = target.closest('[data-board-container]')
        if (!board) {
          // Клик вне доски - НЕ активируем drag, НЕ блокируем событие
          return false
        }
        
        // НЕ активируем для интерактивных элементов
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
          return false
        }
        
        // Активируем drag только для draggable элементов
        return true
      },
    },
  ]
}
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { CreateTaskButton } from './CreateTaskButton'
import { Modal } from './Modal'
import { useBoardCount } from '@/contexts/BoardCountContext'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  name: string
  email: string
}

interface Column {
  id: string
  name: string
  color: string
  position: number
}

interface Task {
  id: string
  title: string
  description: string | null
  columnId: string
  priority: string
  deadline: Date | null
  position: number
  assignee: Member | null
  creator: Member
}

interface KanbanBoardProps {
  boardId: string
  projectId: string
  initialTasks: Task[]
  initialColumns: Column[]
  members: Member[]
  backgroundImage?: string | null
  backgroundColor?: string | null
  isOwner?: boolean
}

export function KanbanBoard({
  boardId,
  projectId,
  initialTasks,
  initialColumns,
  members,
  backgroundImage,
  backgroundColor,
  isOwner = false,
}: KanbanBoardProps) {
  const router = useRouter()
  const { updateTaskCount } = useBoardCount()
  const boardContainerRef = useRef<HTMLDivElement>(null)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns, setColumns] = useState<Column[]>(initialColumns.sort((a, b) => a.position - b.position))
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [isDraggingColumn, setIsDraggingColumn] = useState(false)
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false)
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [columnFormData, setColumnFormData] = useState({
    name: '',
    color: '#8993a4',
  })

  // Кастомный сенсор, который активируется ТОЛЬКО внутри доски
  const sensors = useSensors(
    useSensor(RestrictedMouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const tasksByColumn = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = tasks
        .filter((t) => t.columnId === column.id)
        .sort((a, b) => a.position - b.position)
      return acc
    }, {} as Record<string, Task[]>)
  }, [tasks, columns])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    
    // Проверяем, что событие произошло внутри контейнера доски
    if (boardContainerRef.current && event.activatorEvent) {
      const activatorEvent = event.activatorEvent as PointerEvent | MouseEvent | TouchEvent
      let clientX = 0
      let clientY = 0
      
      if ('clientX' in activatorEvent) {
        clientX = activatorEvent.clientX
        clientY = activatorEvent.clientY
      } else if (activatorEvent.touches && activatorEvent.touches.length > 0) {
        clientX = activatorEvent.touches[0].clientX
        clientY = activatorEvent.touches[0].clientY
      }
      
      const target = document.elementFromPoint(clientX, clientY) as HTMLElement
      
      // Если клик в сайдбаре, header или вне доски - не начинаем drag
      if (
        target?.closest('aside') ||
        target?.closest('header') ||
        target?.closest('[data-no-dnd-block]') ||
        !boardContainerRef.current.contains(target)
      ) {
        return
      }
    }
    
    // Проверяем, это задача или столбец
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
      return
    }
    
    const column = columns.find((c) => c.id === active.id)
    if (column) {
      setActiveColumn(column)
      setIsDraggingColumn(true)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Если перетаскиваем столбец - обновляем визуально (оптимистично)
    const activeColumnDrag = columns.find((c) => c.id === activeId)
    if (activeColumnDrag && isDraggingColumn) {
      const overColumn = columns.find((c) => c.id === overId)
      if (overColumn && activeColumnDrag.id !== overColumn.id) {
        // Обновляем позиции только визуально (оптимистично)
        setColumns((prev) => {
          const sorted = [...prev].sort((a, b) => a.position - b.position)
          const activeIdx = sorted.findIndex((c) => c.id === activeId)
          const overIdx = sorted.findIndex((c) => c.id === overId)
          
          if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
            const [removed] = sorted.splice(activeIdx, 1)
            sorted.splice(overIdx, 0, removed)
            
            // Обновляем позиции визуально (они будут пересчитаны в handleDragEnd)
            return sorted.map((col, index) => ({
              ...col,
              position: index,
            }))
          }
          return prev
        })
      }
      return
    }
    
    // Если перетаскиваем задачу
    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if we're over a column
    const overColumn = columns.find((c) => c.id === overId)
    if (overColumn && activeTask.columnId !== overColumn.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, columnId: overColumn.id } : t
        )
      )
      return
    }

    // Check if we're over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.columnId !== overTask.columnId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, columnId: overTask.columnId } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setActiveColumn(null)
    
    const wasDraggingColumn = isDraggingColumn
    setIsDraggingColumn(false)

    if (!over) {
      // Если упали не на цель - откатываем изменения
      if (wasDraggingColumn) {
        setColumns(initialColumns.sort((a, b) => a.position - b.position))
      } else {
        setTasks(initialTasks)
      }
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Если перетаскиваем столбец
    const activeColumnDrag = columns.find((c) => c.id === activeId)
    if (activeColumnDrag && wasDraggingColumn) {
      const overColumn = columns.find((c) => c.id === overId)
      if (!overColumn || activeColumnDrag.id === overColumn.id) {
        // Не меняли порядок - ничего не делаем
        return
      }

      // Получаем текущий отсортированный массив столбцов (по позициям из базы)
      const sortedColumns = [...columns].sort((a, b) => a.position - b.position)
      const oldIndex = sortedColumns.findIndex((c) => c.id === activeId)
      const newIndex = sortedColumns.findIndex((c) => c.id === overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return
      }

      // Используем arrayMove для правильного перемещения
      const reorderedColumns = arrayMove(sortedColumns, oldIndex, newIndex)

      // Обновляем позиции для всех столбцов (0, 1, 2, 3...)
      const columnsWithNewPositions = reorderedColumns.map((col, index) => ({
        ...col,
        position: index,
      }))

      // Обновляем локальное состояние оптимистично
      setColumns(columnsWithNewPositions)

      // Отправляем обновления на сервер последовательно, чтобы избежать race conditions
      try {
        // Сначала обновляем все позиции на сервере
        const updatePromises = columnsWithNewPositions.map((col) =>
          fetch(`/api/columns/${col.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: col.position }),
          }).then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
              throw new Error(errorData.error || `Failed to update column ${col.id}`)
            }
            return res.json()
          })
        )

        const results = await Promise.all(updatePromises)

        // Обновляем состояние с данными с сервера (проверяем, что позиции сохранились)
        const sortedResults = results.sort((a: Column, b: Column) => a.position - b.position)
        setColumns(sortedResults)
        toast.success('Порядок столбцов обновлён')
      } catch (error) {
        console.error('Error updating columns:', error)
        toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении порядка столбцов')
        
        // Откатываем к исходному состоянию при ошибке
        setColumns(initialColumns.sort((a, b) => a.position - b.position))
      }
      return
    }

    // Если перетаскиваем задачу
    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Determine the new column
    let newColumnId = activeTask.columnId
    const overColumn = columns.find((c) => c.id === overId)
    if (overColumn) {
      newColumnId = overColumn.id
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        newColumnId = overTask.columnId
      }
    }

    // Calculate new position
    const tasksInColumn = tasks
      .filter((t) => t.columnId === newColumnId && t.id !== activeId)
      .sort((a, b) => a.position - b.position)

    let newPosition = 0
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && overId !== newColumnId) {
      const overIndex = tasksInColumn.findIndex((t) => t.id === overId)
      newPosition = overIndex >= 0 ? overIndex : tasksInColumn.length
    } else {
      newPosition = tasksInColumn.length
    }

    // Update local state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, columnId: newColumnId, position: newPosition }
          : t
      )
    )

    // Sync with server
    try {
      const res = await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId: newColumnId,
          position: newPosition,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update task')
      }
    } catch {
      toast.error('Ошибка при обновлении задачи')
      // Revert on error
      setTasks(initialTasks)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => {
      const newTasks = [...prev, newTask]
      updateTaskCount(boardId, newTasks.length)
      // Обновляем страницу для синхронизации с сервером
      setTimeout(() => router.refresh(), 100)
      return newTasks
    })
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    )
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => {
      const newTasks = prev.filter((t) => t.id !== taskId)
      updateTaskCount(boardId, newTasks.length)
      return newTasks
    })
    // Обновляем страницу для синхронизации с сервером
    setTimeout(() => router.refresh(), 200)
  }

  // Обновляем счетчик при изменении задач
  useEffect(() => {
    updateTaskCount(boardId, tasks.length)
  }, [tasks.length, boardId, updateTaskCount])

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingColumn(true)

    try {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnFormData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при создании столбца')
      }

      const newColumn = await res.json()
      setColumns((prev) => [...prev, newColumn].sort((a, b) => a.position - b.position))
      toast.success('Столбец создан')
      setShowCreateColumnModal(false)
      setColumnFormData({ name: '', color: '#8993a4' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsCreatingColumn(false)
    }
  }

  // Фон доски
  const boardStyle: React.CSSProperties = {}
  if (backgroundImage && backgroundImage.trim() !== '') {
    boardStyle.backgroundImage = `url(${backgroundImage})`
    boardStyle.backgroundSize = 'cover'
    boardStyle.backgroundPosition = 'center'
    boardStyle.backgroundRepeat = 'no-repeat'
  }
  if (backgroundColor && backgroundColor.trim() !== '') {
    boardStyle.backgroundColor = backgroundColor
  }

  return (
    <div
      ref={boardContainerRef}
      id={`board-${boardId}`}
      data-board-container
      className="h-full w-full overflow-hidden relative isolate" 
      style={{ ...boardStyle, contain: 'layout style' }}
    >
      <div className="h-full w-full overflow-x-auto overflow-y-hidden">
        <div className="p-6 flex items-start gap-4 w-max min-h-full">
        {/* DndContext ВРЕМЕННО ОТКЛЮЧЁН для диагностики */}
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns
              .sort((a, b) => a.position - b.position)
              .map((column) => (
              <SortableContext
                key={column.id}
                items={tasksByColumn[column.id]?.map((t) => t.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.name}
                  color={column.color}
                  count={tasksByColumn[column.id]?.length || 0}
                  boardId={boardId}
                  isOwner={isOwner}
                  onColumnUpdate={async () => {
                    const res = await fetch(`/api/boards/${boardId}`)
                    if (res.ok) {
                      const updatedBoard = await res.json()
                      setColumns(updatedBoard.columns.sort((a: Column, b: Column) => a.position - b.position))
                    }
                  }}
                  onColumnDelete={async () => {
                    const res = await fetch(`/api/boards/${boardId}`)
                    if (res.ok) {
                      const updatedBoard = await res.json()
                      setColumns(updatedBoard.columns.sort((a: Column, b: Column) => a.position - b.position))
                    }
                  }}
                >
                  {tasksByColumn[column.id]?.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onUpdate={handleTaskUpdated}
                      onDelete={handleTaskDeleted}
                    />
                  ))}
                  <CreateTaskButton
                    boardId={boardId}
                    projectId={projectId}
                    columnId={column.id}
                    members={members}
                    onCreated={handleTaskCreated}
                  />
                </KanbanColumn>
              </SortableContext>
            ))}

            {/* Create Column Button */}
            {isOwner && (
              <div className="w-80 flex-shrink-0">
                <button
                  onClick={() => setShowCreateColumnModal(true)}
                  className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить столбец
                </button>
              </div>
            )}
          </SortableContext>

          {/* DragOverlay и DndContext закрывающий тег убраны для диагностики */}
        </div>
      </div>

      {/* Create Column Modal */}
      <Modal
        isOpen={showCreateColumnModal}
        onClose={() => setShowCreateColumnModal(false)}
        title="Создать столбец"
      >
        <form onSubmit={handleCreateColumn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название столбца
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Название столбца"
              value={columnFormData.name}
              onChange={(e) => setColumnFormData({ ...columnFormData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет
            </label>
            <input
              type="color"
              className="w-full h-10 rounded border border-gray-300"
              value={columnFormData.color}
              onChange={(e) => setColumnFormData({ ...columnFormData, color: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateColumnModal(false)}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isCreatingColumn || !columnFormData.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isCreatingColumn ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

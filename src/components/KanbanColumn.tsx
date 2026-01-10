'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { Modal } from './Modal'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  boardId: string
  children: React.ReactNode
  isOwner: boolean
  onColumnUpdate?: () => void
  onColumnDelete?: () => void
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  boardId,
  children,
  isOwner,
  onColumnUpdate,
  onColumnDelete,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isOwner })

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id })

  // Объединяем refs с помощью callback
  const combinedRef = (node: HTMLDivElement | null) => {
    setSortableNodeRef(node)
    setDroppableNodeRef(node)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: title,
    color: color,
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`/api/columns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при обновлении')
      }

      toast.success('Столбец обновлён')
      setShowEditModal(false)
      onColumnUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)

    try {
      const res = await fetch(`/api/columns/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при удалении')
      }

      toast.success('Столбец удалён')
      setShowDeleteModal(false)
      onColumnDelete?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      ref={combinedRef}
      style={style as React.CSSProperties}
      {...attributes}
      className={clsx(
        'w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200 relative',
        isOver && 'ring-2 ring-accent/30',
        isDragging && 'shadow-xl z-50',
        isOwner && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Цветная полоска сверху */}
      <div
        className="h-1 rounded-t-lg"
        style={{ backgroundColor: color }}
      />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isOwner && (
              <div
                {...listeners}
                className="w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing"
              >
                <svg
                  className="w-full h-full text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            )}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            <span className="text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">
              {count}
            </span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEditModal(true)
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Редактировать столбец"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {count === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteModal(true)
                  }}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Удалить столбец"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
        {children}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать столбец"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет
            </label>
            <input
              type="color"
              className="w-full h-10 rounded border border-gray-300"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить столбец"
      >
        <p className="text-gray-600 mb-4">
          Вы уверены, что хотите удалить столбец "{title}"? Это действие нельзя отменить.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            className="btn-primary bg-red-600 hover:bg-red-700 flex-1 disabled:opacity-50"
          >
            {isSaving ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </Modal>
    </div>
  )
}



'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { clsx } from 'clsx'
import { format, isPast, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Modal } from './Modal'

interface Member {
  id: string
  name: string
  email: string
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

interface TaskCardProps {
  task: Task
  members: Member[]
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Срочно', color: 'text-priority-urgent', bg: 'bg-priority-urgent/10' },
  high: { label: 'Высокий', color: 'text-priority-high', bg: 'bg-priority-high/10' },
  medium: { label: 'Средний', color: 'text-priority-medium', bg: 'bg-priority-medium/10' },
  low: { label: 'Низкий', color: 'text-priority-low', bg: 'bg-priority-low/10' },
}

export function TaskCard({ task, members, onUpdate, onDelete, isDragging }: TaskCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    assigneeId: task.assignee?.id || '',
    deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = priorityConfig[task.priority]
  const deadline = task.deadline ? new Date(task.deadline) : null
  const isOverdue = deadline && isPast(deadline) && task.columnId !== 'done'
  const isDueToday = deadline && isToday(deadline) && task.columnId !== 'done'

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          assigneeId: formData.assigneeId || null,
          deadline: formData.deadline || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      const updated = await res.json()
      onUpdate(updated)
      setShowEditModal(false)
      toast.success('Задача обновлена')
    } catch {
      toast.error('Ошибка при обновлении')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить задачу?')) return

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      onDelete(task.id)
      toast.success('Задача удалена')
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={clsx(
          'group bg-white border border-gray-200 rounded-lg p-4 cursor-grab active:cursor-grabbing',
          'hover:border-gray-300 transition-all duration-200',
          (isDragging || isSortableDragging) && 'opacity-50 shadow-xl',
          isOverdue && 'border-priority-urgent/30'
        )}
        onClick={() => setShowEditModal(true)}
      >
        {/* Priority badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', priority.color, priority.bg)}>
            {priority.label}
          </span>
          {isOverdue && (
            <span className="text-xs text-priority-urgent flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Просрочено
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-600">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Не назначен</span>
          )}

          {/* Deadline */}
          {deadline && (
            <span className={clsx(
              'text-xs flex items-center gap-1',
              isOverdue ? 'text-priority-urgent' : isDueToday ? 'text-priority-medium' : 'text-gray-600'
            )}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {format(deadline, 'd MMM', { locale: ru })}
            </span>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать задачу"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Приоритет
              </label>
              <select
                className="input-field"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочно</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дедлайн
              </label>
              <input
                type="date"
                className="input-field"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Исполнитель
            </label>
            <select
              className="input-field"
              value={formData.assigneeId}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
            >
              <option value="">Не назначен</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="btn-ghost text-priority-urgent hover:bg-priority-urgent/10"
            >
              Удалить
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn-primary disabled:opacity-50"
            >
              {isUpdating ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}



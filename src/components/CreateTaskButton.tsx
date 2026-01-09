'use client'

import { useState } from 'react'
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
  status: string
  priority: string
  deadline: Date | null
  position: number
  assignee: Member | null
  creator: Member
}

interface CreateTaskButtonProps {
  projectId: string
  status: string
  members: Member[]
  onCreated: (task: Task) => void
}

export function CreateTaskButton({ projectId, status, members, onCreated }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeId: '',
    deadline: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          projectId,
          status,
          priority: formData.priority,
          assigneeId: formData.assigneeId || undefined,
          deadline: formData.deadline || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при создании задачи')
      }

      const newTask = await res.json()
      onCreated(newTask)
      toast.success('Задача создана!')
      setIsOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigneeId: '',
        deadline: '',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-white/20 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить задачу
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Создать задачу">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Что нужно сделать?"
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
              placeholder="Подробности..."
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
              onClick={() => setIsOpen(false)}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isLoading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}



'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Modal } from './Modal'

export function CreateProjectButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при создании проекта')
      }

      toast.success('Проект создан!')
      setIsOpen(false)
      setFormData({ name: '', description: '' })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Новый проект
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Создать проект">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
              Название проекта
            </label>
            <input
              id="name"
              type="text"
              required
              className="input-field"
              placeholder="Мой проект"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
              Описание (опционально)
            </label>
            <textarea
              id="description"
              rows={3}
              className="input-field resize-none"
              placeholder="Краткое описание проекта..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              disabled={isLoading || !formData.name.trim()}
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


'use client'

import { useState, startTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { Modal } from './Modal'

interface Board {
  id: string
  name: string
  description: string | null
  position: number
  _count?: { tasks: number }
}

interface BoardSelectorProps {
  projectId: string
  boards: Board[]
  currentBoardId: string
  isOwner: boolean
}

export function BoardSelector({
  projectId,
  boards,
  currentBoardId,
  isOwner,
}: BoardSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при создании доски')
      }

      const newBoard = await res.json()
      toast.success('Доска создана')
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      // Используем window.location для полной перезагрузки с новой доской
      window.location.href = `/projects/${projectId}?board=${newBoard.id}`
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  const currentBoard = boards.find((b) => b.id === currentBoardId)

  return (
    <>
      <div className="flex items-center gap-2 px-8 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-600">Доски:</span>
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => {
                if (board.id === currentBoardId) return
                setIsNavigating(true)
                router.push(`/projects/${projectId}?board=${board.id}`)
                // Router refresh вызовется автоматически при переходе
                setTimeout(() => setIsNavigating(false), 500)
              }}
              disabled={isNavigating}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${
                board.id === currentBoardId
                  ? 'bg-accent text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {board.name}
              {board._count && (
                <span className="ml-2 text-xs opacity-75">
                  {board._count.tasks}
                </span>
              )}
            </button>
          ))}
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 border-dashed flex items-center gap-1 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Новая доска
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать доску"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название доски
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Название доски"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Описание доски (необязательно)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
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


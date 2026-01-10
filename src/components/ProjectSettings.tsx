'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Modal } from './Modal'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface ProjectSettingsProps {
  project: {
    id: string
    ownerId: string
    name: string
    description: string | null
    backgroundImage: string | null
    backgroundColor: string | null
  }
  members: Member[]
  isOwner: boolean
}

export function ProjectSettings({ project, members, isOwner }: ProjectSettingsProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    backgroundColor: project.backgroundColor || '',
  })
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description.trim() || null,
          backgroundColor: formData.backgroundColor.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      toast.success('Настройки сохранены')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)

    try {
      const res = await fetch(`/api/projects/${project.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при приглашении')
      }

      toast.success(data.message)
      setShowInviteModal(false)
      setInviteEmail('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsInviting(false)
    }
  }

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением')
      return
    }

    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB')
      return
    }

    setIsUploadingBackground(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch(`/api/projects/${project.id}/upload-background`, {
        method: 'POST',
        body: uploadFormData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при загрузке')
      }

      const updated = await res.json()
      toast.success('Фон обновлён')
      // Обновляем локальное состояние проекта с новым фоном
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setIsUploadingBackground(false)
      e.target.value = ''
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при удалении')
      }

      toast.success('Участник удалён')
      setShowRemoveModal(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка')
    }
  }

  if (!isOwner) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-600">Только владелец проекта может изменять настройки</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Вернуться к проекту
        </Link>
        <h1 className="text-3xl font-bold">Настройки проекта</h1>
      </div>

      {/* Project Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название проекта
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
              Описание
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цвет фона
              </label>
              <input
                type="color"
                className="w-full h-10 rounded border border-gray-300"
                value={formData.backgroundColor || '#f4f5f7'}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Изображение фона
              </label>
              
              {/* Текущее изображение */}
              {project.backgroundImage && (
                <div className="mb-3 relative group">
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 relative">
                    <img
                      src={project.backgroundImage}
                      alt="Фон проекта"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Текущий фон
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <label className="relative inline-flex items-center justify-center px-4 py-2.5 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  disabled={isUploadingBackground}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  {isUploadingBackground ? (
                    <>
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium text-gray-700">Загрузка...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {project.backgroundImage ? 'Изменить файл' : 'Выбрать файл'}
                      </span>
                    </>
                  )}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Поддерживаются форматы: JPG, PNG, GIF (макс. 5MB)
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>

      {/* Members */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Участники проекта</h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Пригласить
          </button>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              {member.id !== project.ownerId && (
                <button
                  onClick={() => setShowRemoveModal(member.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Пригласить участника"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email участника
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isInviting ? 'Приглашение...' : 'Пригласить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Modal */}
      <Modal
        isOpen={showRemoveModal !== null}
        onClose={() => setShowRemoveModal(null)}
        title="Удалить участника"
      >
        <p className="text-gray-600 mb-4">
          Вы уверены, что хотите удалить этого участника из проекта?
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowRemoveModal(null)}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => showRemoveModal && handleRemoveMember(showRemoveModal)}
            className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
          >
            Удалить
          </button>
        </div>
      </Modal>
    </>
  )
}


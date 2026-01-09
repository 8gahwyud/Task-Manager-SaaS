'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Modal } from './Modal'

interface Member {
  id: string
  name: string
  email: string
}

interface ProjectHeaderProps {
  project: {
    id: string
    name: string
    description: string | null
  }
  members: Member[]
  isOwner: boolean
}

export function ProjectHeader({ project, members, isOwner }: ProjectHeaderProps) {
  const router = useRouter()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

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

  return (
    <>
      <header className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Members */}
            <div className="flex items-center -space-x-2">
              {members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium border-2 border-white"
                  title={member.name}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium border-2 border-white">
                  +{members.length - 4}
                </div>
              )}
            </div>

            {/* Invite button */}
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Пригласить
              </button>
            )}
          </div>
        </div>
      </header>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Пригласить участника"
      >
        <form onSubmit={handleInvite} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email участника
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <p className="text-xs text-gray-600 mt-2">
              Если пользователь зарегистрирован, он сразу получит доступ к проекту
            </p>
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
    </>
  )
}



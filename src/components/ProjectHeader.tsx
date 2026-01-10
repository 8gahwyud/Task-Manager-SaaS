'use client'

import Link from 'next/link'

interface Member {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
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

  return (
    <>
      <header className="px-8 py-6 border-b border-gray-200 w-full overflow-x-hidden relative z-20 pointer-events-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative z-30"
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
                  className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium border-2 border-white overflow-hidden flex-shrink-0"
                  title={member.name}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium border-2 border-white flex-shrink-0">
                  +{members.length - 4}
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.id}/settings`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Настройки
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}



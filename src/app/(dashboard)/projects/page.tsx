import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CreateProjectButton } from '@/components/CreateProjectButton'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session!.user.id },
        { members: { some: { userId: session!.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { tasks: true } },
      tasks: {
        select: { status: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Проекты</h1>
          <p className="text-gray-600">
            Управляйте своими проектами и задачами
          </p>
        </div>
        <CreateProjectButton />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Нет проектов</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Создайте свой первый проект, чтобы начать управлять задачами
          </p>
          <CreateProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const tasksByStatus = project.tasks.reduce(
              (acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1
                return acc
              },
              {} as Record<string, number>
            )

            const progress = project._count.tasks > 0
              ? Math.round(((tasksByStatus['done'] || 0) / project._count.tasks) * 100)
              : 0

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card p-6 hover:border-gray-300 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  {project.ownerId === session!.user.id && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                      Владелец
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Прогресс</span>
                    <span className="text-gray-700">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {project._count.tasks} задач
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {project.members.length}
                  </div>
                </div>

                {/* Members avatars */}
                {project.members.length > 0 && (
                  <div className="flex items-center mt-4 -space-x-2">
                    {project.members.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                        title={member.user.name}
                      >
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}



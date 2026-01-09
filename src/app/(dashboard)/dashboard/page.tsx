import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [projects, recentTasks, stats] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session!.user.id },
          { members: { some: { userId: session!.user.id } } },
        ],
      },
      include: {
        _count: { select: { tasks: true } },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.task.findMany({
      where: {
        project: {
          OR: [
            { ownerId: session!.user.id },
            { members: { some: { userId: session!.user.id } } },
          ],
        },
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        project: {
          OR: [
            { ownerId: session!.user.id },
            { members: { some: { userId: session!.user.id } } },
          ],
        },
      },
      _count: true,
    }),
  ])

  const totalTasks = stats.reduce((acc, s) => acc + s._count, 0)
  const doneTasks = stats.find((s) => s.status === 'done')?._count || 0
  const inProgressTasks = stats.find((s) => s.status === 'in_progress')?._count || 0

  const overdueTasks = await prisma.task.count({
    where: {
      project: {
        OR: [
          { ownerId: session!.user.id },
          { members: { some: { userId: session!.user.id } } },
        ],
      },
      deadline: { lt: new Date() },
      status: { not: 'done' },
    },
  })

  const statusColors: Record<string, string> = {
    todo: 'bg-status-todo',
    in_progress: 'bg-status-progress',
    review: 'bg-status-review',
    done: 'bg-status-done',
  }

  const priorityColors: Record<string, string> = {
    urgent: 'text-priority-urgent',
    high: 'text-priority-high',
    medium: 'text-priority-medium',
    low: 'text-priority-low',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Привет, {session!.user.name}! 👋
        </h1>
        <p className="text-zinc-500">
          Вот обзор ваших задач и проектов
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Всего задач',
            value: totalTasks,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            color: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'В работе',
            value: inProgressTasks,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            color: 'text-status-progress',
            bg: 'bg-status-progress/10',
          },
          {
            label: 'Выполнено',
            value: doneTasks,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-status-done',
            bg: 'bg-status-done/10',
          },
          {
            label: 'Просрочено',
            value: overdueTasks,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-priority-urgent',
            bg: 'bg-priority-urgent/10',
          },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 text-sm">{stat.label}</span>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Последние проекты</h2>
            <Link
              href="/projects"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Все проекты →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-surface-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-zinc-500 mb-4">У вас пока нет проектов</p>
              <Link href="/projects" className="btn-primary inline-block">
                Создать проект
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-accent group-hover:from-accent/30 group-hover:to-purple-500/30 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {project.name}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {project._count.tasks} задач
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Последние задачи</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-surface-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-zinc-500">Задачи появятся здесь</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentTasks.map((task) => (
                <li
                  key={task.id}
                  className="p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[task.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">{task.project.name}</span>
                        <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority === 'urgent' && '🔴'}
                          {task.priority === 'high' && '🟠'}
                          {task.priority === 'medium' && '🟡'}
                          {task.priority === 'low' && '🟢'}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: ru })}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  // Get all tasks for user's projects
  const tasks = await prisma.task.findMany({
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
  })

  // Stats by status
  const statsByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Stats by priority
  const statsByPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Stats by project
  const statsByProject = tasks.reduce((acc, task) => {
    acc[task.project.name] = (acc[task.project.name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Overdue tasks
  const now = new Date()
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'done'
  )

  // Tasks created last 7 days
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)
  const recentTasks = tasks.filter((t) => new Date(t.createdAt) >= last7Days)

  // Completed this week
  const completedThisWeek = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updatedAt) >= last7Days
  )

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
  }

  const priorityLabels: Record<string, string> = {
    urgent: 'Срочный',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Аналитика</h1>
        <p className="text-gray-600">
          Статистика по вашим проектам и задачам
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Всего задач',
            value: tasks.length,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            color: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'Создано за неделю',
            value: recentTasks.length,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ),
            color: 'text-status-progress',
            bg: 'bg-status-progress/10',
          },
          {
            label: 'Выполнено за неделю',
            value: completedThisWeek.length,
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
            value: overdueTasks.length,
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
              <span className="text-gray-600 text-sm">{stat.label}</span>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">По статусам</h3>
          <div className="space-y-4">
            {Object.entries(statsByStatus).map(([status, count]) => {
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0
              const colors: Record<string, string> = {
                todo: 'bg-status-todo',
                in_progress: 'bg-status-progress',
                review: 'bg-status-review',
                done: 'bg-status-done',
              }
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{statusLabels[status] || status}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[status] || 'bg-accent'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(statsByStatus).length === 0 && (
              <p className="text-gray-600 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">По приоритетам</h3>
          <div className="space-y-4">
            {Object.entries(statsByPriority).map(([priority, count]) => {
              const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0
              const colors: Record<string, string> = {
                urgent: 'bg-priority-urgent',
                high: 'bg-priority-high',
                medium: 'bg-priority-medium',
                low: 'bg-priority-low',
              }
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{priorityLabels[priority] || priority}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[priority] || 'bg-accent'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(statsByPriority).length === 0 && (
              <p className="text-gray-600 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts component (client-side) */}
      <AnalyticsCharts
        statsByStatus={statsByStatus}
        statsByPriority={statsByPriority}
        statsByProject={statsByProject}
        statusLabels={statusLabels}
        priorityLabels={priorityLabels}
      />

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-priority-urgent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Просроченные задачи
          </h3>
          <div className="space-y-3">
            {overdueTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-priority-urgent/5 border border-priority-urgent/20"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600">
                    {task.project.name}
                    {task.assignee && ` • ${task.assignee.name}`}
                  </p>
                </div>
                <span className="text-sm text-priority-urgent">
                  {task.deadline && new Date(task.deadline).toLocaleDateString('ru-RU')}
                </span>
              </div>
            ))}
            {overdueTasks.length > 5 && (
              <p className="text-sm text-gray-600 text-center">
                И ещё {overdueTasks.length - 5} задач...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



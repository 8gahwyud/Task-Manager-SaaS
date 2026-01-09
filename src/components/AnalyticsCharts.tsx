'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsChartsProps {
  statsByStatus: Record<string, number>
  statsByPriority: Record<string, number>
  statsByProject: Record<string, number>
  statusLabels: Record<string, string>
  priorityLabels: Record<string, string>
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  review: '#a855f7',
  done: '#10b981',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export function AnalyticsCharts({
  statsByStatus,
  statsByPriority,
  statsByProject,
  statusLabels,
  priorityLabels,
}: AnalyticsChartsProps) {
  const statusData = Object.entries(statsByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#6366f1',
  }))

  const priorityData = Object.entries(statsByPriority).map(([priority, count]) => ({
    name: priorityLabels[priority] || priority,
    value: count,
    color: PRIORITY_COLORS[priority] || '#6366f1',
  }))

  const projectData = Object.entries(statsByProject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      tasks: count,
    }))

  const hasData = statusData.length > 0 || priorityData.length > 0 || projectData.length > 0

  if (!hasData) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Pie Chart */}
      {statusData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Распределение по статусам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    color: '#172b4d',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Pie Chart */}
      {priorityData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Распределение по приоритетам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    color: '#172b4d',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {priorityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Bar Chart */}
      {projectData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Задачи по проектам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical">
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    color: '#172b4d',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar
                  dataKey="tasks"
                  fill="#0052cc"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}



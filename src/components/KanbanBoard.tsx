'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { CreateTaskButton } from './CreateTaskButton'

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

interface KanbanBoardProps {
  projectId: string
  initialTasks: Task[]
  members: Member[]
}

const STATUSES = [
  { id: 'todo', label: 'To Do', color: 'bg-status-todo' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-status-progress' },
  { id: 'review', label: 'Review', color: 'bg-status-review' },
  { id: 'done', label: 'Done', color: 'bg-status-done' },
]

export function KanbanBoard({ projectId, initialTasks, members }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const tasksByStatus = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status.id] = tasks
        .filter((t) => t.status === status.id)
        .sort((a, b) => a.position - b.position)
      return acc
    }, {} as Record<string, Task[]>)
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if we're over a column
    const overStatus = STATUSES.find((s) => s.id === overId)
    if (overStatus && activeTask.status !== overStatus.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overStatus.id } : t
        )
      )
      return
    }

    // Check if we're over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Determine the new status
    let newStatus = activeTask.status
    const overStatus = STATUSES.find((s) => s.id === overId)
    if (overStatus) {
      newStatus = overStatus.id
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    // Calculate new position
    const tasksInColumn = tasks
      .filter((t) => t.status === newStatus && t.id !== activeId)
      .sort((a, b) => a.position - b.position)

    let newPosition = 0
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && overId !== newStatus) {
      const overIndex = tasksInColumn.findIndex((t) => t.id === overId)
      newPosition = overIndex >= 0 ? overIndex : tasksInColumn.length
    } else {
      newPosition = tasksInColumn.length
    }

    // Update local state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, status: newStatus, position: newPosition }
          : t
      )
    )

    // Sync with server
    try {
      const res = await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          position: newPosition,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update task')
      }
    } catch {
      toast.error('Ошибка при обновлении задачи')
      // Revert on error
      setTasks(initialTasks)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    )
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-4 min-w-max h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {STATUSES.map((status) => (
            <SortableContext
              key={status.id}
              items={tasksByStatus[status.id].map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                id={status.id}
                title={status.label}
                color={status.color}
                count={tasksByStatus[status.id].length}
              >
                {tasksByStatus[status.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    onUpdate={handleTaskUpdated}
                    onDelete={handleTaskDeleted}
                  />
                ))}
                <CreateTaskButton
                  projectId={projectId}
                  status={status.id}
                  members={members}
                  onCreated={handleTaskCreated}
                />
              </KanbanColumn>
            </SortableContext>
          ))}

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                members={members}
                onUpdate={handleTaskUpdated}
                onDelete={handleTaskDeleted}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}



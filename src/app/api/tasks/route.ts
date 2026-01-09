import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Проект обязателен'),
  assigneeId: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
})

// Создать задачу
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = taskSchema.parse(body)

    // Проверяем доступ к проекту
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден или нет доступа' },
        { status: 404 }
      )
    }

    // Получаем максимальную позицию для статуса
    const maxPosition = await prisma.task.aggregate({
      where: {
        projectId: data.projectId,
        status: data.status,
      },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority,
        status: data.status,
        position: (maxPosition._max.position ?? -1) + 1,
        creatorId: session.user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании задачи' },
      { status: 500 }
    )
  }
}

